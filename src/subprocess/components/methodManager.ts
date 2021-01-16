import {
    IBaseDatasetField,
    IFormatter,
    ISubsetFormatter,
    IMethodRecord,
    ISubsetRecord,
    IMethodFormatter,
    IMethodCreateParams,
    EMethodType,
} from "../../interfaces";

import qm from "qminer";
import { BadRequest } from "../../utils/ErrorDefs";

import Aggregates from "./models/Aggregates";
import ClusteringKMeans from "./models/ClusteringKMeans";

export default class MethodManager {
    private formatter: IFormatter;
    private methods: { [key: string]: any };

    /**
     * Creates a new MethodManager instance.
     * @param formatter - The formating functions.
     */
    constructor(formatter: IFormatter) {
        this.formatter = formatter;
        this.methods = {};
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
                model = new Aggregates(base, subset, method.parameters, fields);
                model.init().train();
                break;
            case EMethodType.CLUSTERING_KMEANS:
                model = new ClusteringKMeans(base, subset, method.parameters);
                await (await model.init()).train();
                break;
            default:
                throw new BadRequest(`Invalid method type; type=${method.type}`);
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

    /////////////////////////////////////////////
    // SPECIFIC FUNCTIONALITIES
    /////////////////////////////////////////////
}
