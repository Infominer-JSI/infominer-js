import {
    IBaseDatasetField,
    IFormatter,
    ISubsetFormatter,
    IMethodRecord,
    ISubsetRecord,
    IMethodFormatter,
    IMethodCreateParams,
    EMethodType,
    IMethodUpdateParams,
    EMethodStep,
    IKMeansModelParams,
    IALearnModelParams,
    IALearnUpdateParams,
} from "../../interfaces";

import qm from "qminer";
import { BadRequest } from "../../utils/ErrorDefs";

import ActiveLearning from "./models/ActiveLearning";
import Aggregates from "./models/Aggregates";
import KMeansClustering from "./models/KMeansClustering";

export default class MethodManager {
    private formatter: IFormatter;
    private models: { [key: number]: Aggregates | KMeansClustering | ActiveLearning };

    /**
     * Creates a new MethodManager instance.
     * @param formatter - The formating functions.
     */
    constructor(formatter: IFormatter) {
        this.formatter = formatter;
        this.models = {};
    }

    /////////////////////////////////////////////
    // METHOD HANDLERS
    /////////////////////////////////////////////

    /**
     * Gets all of the non-deleted methods.
     * @param base - The qminer base.
     */
    getMethods(base: qm.Base) {
        const methods = base.store("Methods").allRecords;
        if (methods && !methods.empty && methods[0] && methods[0].deleted !== undefined) {
            methods.filterByField("deleted", false);
        }
        return {
            methods: methods.map((rec) =>
                this.formatter.method(rec as IMethodRecord)
            ) as IMethodFormatter[],
        };
    }

    /**
     * Creates a new method.
     * @param base - The qminer base.
     * @param method - The method parameters.
     * @param fields - The qminer base fields.
     */
    async createMethod(base: qm.Base, method: IMethodCreateParams, fields: IBaseDatasetField[]) {
        // get the subset associated with the method
        const subset = base.store("Subsets")[method.parameters.subsetId] as ISubsetRecord;
        if (!subset || subset.deleted) {
            throw new BadRequest(`Invalid subset; id=${method.parameters.subsetId}`);
        }
        let model;
        switch (method.type) {
            case EMethodType.AGGREGATE:
                // create a new model instance
                model = new Aggregates(base, subset, method.parameters, fields);
                // initialize the model and train it
                model.init().train();
                break;
            case EMethodType.CLUSTERING_KMEANS:
                // create a new model instance
                model = new KMeansClustering(base, subset, method.parameters as IKMeansModelParams);
                // initialize the model and train it
                await model.init();
                await model.train();
                break;
            case EMethodType.ACTIVE_LEARNING:
                // create a new model instance
                model = new ActiveLearning(base, subset, method.parameters as IALearnModelParams);
                // initialize the model
                await model.init();
                // save the model for further access
                this.models[model.getMethod().$id] = model;
                break;
            default:
                throw new BadRequest(`Invalid method type; type=${method.type}`);
        }
        // get the method metadata
        return { methods: model.getMethod() };
    }

    async updateMethod(base: qm.Base, methodId: number, params: IMethodUpdateParams) {
        if (!this.models[methodId]) {
            throw new BadRequest(`Invalid method id (method cannot be updated); id=${methodId}`);
        }
        // get the model to be updated
        const model = this.models[methodId];
        switch (params.step) {
            case EMethodStep.TRAIN:
                // train the model
                await model.train();
                // delete the model from the pending list
                delete this.models[methodId];
                break;
            case EMethodStep.UPDATE:
                // update the model
                switch (model.getType()) {
                    case EMethodType.ACTIVE_LEARNING:
                        await model.update(params.parameters as IALearnUpdateParams);
                        break;
                }
                break;
            default:
                throw new BadRequest(`Invalid method step; step=${params.step}`);
        }
        // get the method metadata
        return { methods: model.getMethod() };
    }

    /**
     * Gets the specific method metadata.
     * @param base - The qminer base.
     * @param methodId - The method ID.
     */
    getMethod(base: qm.Base, methodId: number) {
        /**
         * Gets all of the undeleted records.
         * @param recordSet - The methods record set.
         */
        const getMethodSubsets = (recordSet: qm.RecordSet) => {
            if (!recordSet.empty && recordSet[0] && recordSet[0].deleted !== undefined) {
                recordSet.filterByField("deleted", false);
            }
            return recordSet;
        };
        if (!Number.isInteger(methodId)) {
            throw new BadRequest(`Invalid method; methodId=${methodId}`);
        }
        // get the subset record
        const method = base.store("Methods")[methodId] as IMethodRecord;
        if (!method || method.deleted) {
            throw new BadRequest(`Method does not exist; methodId=${methodId}`);
        }
        // prepare the response
        const response = {
            methods: this.formatter.method(method),
            subsets: [] as ISubsetFormatter[],
        };
        // get all associated methods
        if (method.appliedOn) {
            response.subsets.push(this.formatter.subset(method.appliedOn as ISubsetRecord));
        }
        if (!method.produced?.empty) {
            const produced = getMethodSubsets(method.produced as qm.RecordSet);
            response.subsets.push(
                ...produced.map((rec) => this.formatter.subset(rec as ISubsetRecord))
            );
        }
        return response;
    }

    /**
     * Deletes the methods and its associate subsets.
     * @param base - The qminer base.
     * @param methodId - The method ID.
     * @param callback - The function called to delete subsets related to the method.
     */
    deleteMethod(base: qm.Base, methodId: number, callback: any) {
        if (!Number.isInteger(methodId)) {
            throw new BadRequest(`Invalid method; methodId=${methodId}`);
        }
        if (this.models[methodId]) {
            // the model is still being processed
            this.models[methodId].delete();
            delete this.models[methodId];
            return true;
        }
        // the method is already finished
        const method = base.store("Methods")[methodId] as IMethodRecord;
        if (!method || method.deleted) {
            return true;
        }
        if (method.deleted !== undefined && method.deleted === false) {
            method.deleted = true;
            method.produced?.each((rec: qm.Record) => {
                callback(base, rec.$id, this.deleteMethod.bind(this));
            });
        }

        return true;
    }
}
