import {
    EMethodStatus,
    EMethodType,
    IALearnModelParams,
    IALearnUpdateParams,
    IDocument,
    ISubsetRecord,
} from "../../../interfaces";

import qm from "qminer";
import ModelBasic from "./ModelBasic";

// get the promise version of setImmediate
import { promisify } from "util";
import { BadRequest } from "../../../utils/ErrorDefs";
const setImmediateP = promisify(setImmediate);

export default class ActiveLearning extends ModelBasic {
    private result: { [key: string]: any };
    private featureSpace: qm.FeatureSpace | null;
    private featureMatrix: qm.la.SparseMatrix | null;
    private model: qm.analytics.ActiveLearner | null;
    private elements: qm.RecordSet;
    private isModelInit: boolean;
    private labelCount: { positive: number; negative: number };
    private positiveDocs: number[];
    private negativeDocs: number[];
    private docGenerator: Generator<IDocument>;

    /**
     * Creates a new ActiveLearning instance.
     * @param base - The QMiner base.
     * @param subset - The subset.
     * @param params - The model parameters.
     */
    constructor(base: qm.Base, subset: ISubsetRecord, params: IALearnModelParams) {
        super(base, subset, params, EMethodType.ACTIVE_LEARNING);
        this.featureSpace = null;
        this.featureMatrix = null;
        this.model = null;
        this.result = {};
        // get the document elements
        this.elements = this.subset.hasElements;
        // prepare labelling placeholders
        this.isModelInit = false;
        this.labelCount = {
            positive: 0,
            negative: 0,
        };
        this.positiveDocs = [];
        this.negativeDocs = [];
        this.docGenerator = this._initialDocuments();
    }

    /** Initializes the model. */
    async init(): Promise<ActiveLearning> {
        try {
            // set the feature space
            await this._setFeatureSpace();
            // initialize the model
            this._initializeModel();
            // get the first document to be labelled
            this._assignNextDocument();
            // set the method status
            this.method.status = EMethodStatus.TRAINING;
            return this;
        } catch (error: any) {
            this._handleError(error);
            return this;
        }
    }

    /**
     * Updates the active learning model.
     * @param updateParams - The update parameters.
     */
    async update(updateParams: IALearnUpdateParams): Promise<ActiveLearning> {
        try {
            const params = this.getParams();
            // get the parameter information
            const {
                next: { documentId, label },
            } = updateParams.method.documents;
            // find the document within the elements
            for (let i = 0; i < this.elements.length; i++) {
                const element = this.elements[i] as qm.Record;
                if (element.$id === documentId) {
                    this.model?.setLabel(i, label);
                    // update the method parameters
                    if (!params.method.documents.labelled) {
                        params.method.documents.labelled = [];
                    }
                    // update the parameters
                    let isExistingDocument = false;
                    for (const labelled of params.method.documents.labelled) {
                        // check if the document is one of the existing ones
                        if (labelled.documentId === documentId) {
                            // get the old label and assign new ones
                            const oldLabel = labelled.label;
                            labelled.label = label;
                            if (label !== oldLabel) {
                                // change the statistics only if the label is different
                                this.labelCount.positive += label > 0 ? 1 : -1;
                                this.labelCount.negative += label > 0 ? -1 : 1;
                                if (label > 0) {
                                    // switch the document IDs; negative to positive
                                    this.positiveDocs.push(documentId);
                                    this.negativeDocs.splice(
                                        this.negativeDocs.indexOf(documentId),
                                        1
                                    );
                                } else {
                                    // switch the document IDs; positive to negative
                                    this.positiveDocs.splice(
                                        this.positiveDocs.indexOf(documentId),
                                        1
                                    );
                                    this.negativeDocs.push(documentId);
                                }
                            }
                            isExistingDocument = true;
                            break;
                        }
                    }
                    if (isExistingDocument) {
                        break;
                    }
                    params.method.documents.labelled.push({ documentId, label });
                    // update the model parameters
                    if (label > 0) {
                        this.labelCount.positive++;
                        this.positiveDocs.push(documentId);
                    } else if (label < 0) {
                        this.labelCount.negative++;
                        this.negativeDocs.push(documentId);
                    }
                    break;
                }
            }
            this.method.parameters = params;
            // assign the next document
            this._assignNextDocument();
            if (this.isModelInit) {
                // get the subset statistics
                this.result = this.statistics();
                // set the method results for visualization
                this.method.result = this.result;
            }
            return this;
        } catch (error: any) {
            this._handleError(error);
            return this;
        }
    }

    /** Trains the model. */
    train(): ActiveLearning {
        // get the final results of the model
        this.result = this.statistics();
        // set the method results
        this.method.result = this.result;
        this.method.status = EMethodStatus.FINISHED;
        return this;
    }

    /** Get the method parameters. */
    getParams() {
        return this.params as IALearnModelParams;
    }

    /** Get the statistics. */
    statistics() {
        // get the positive and negative subset statistics
        const { positive, negative } = this._getSubsetStatistics();
        // output the statistics
        return {
            labelCount: this.labelCount,
            positive,
            negative,
            get all() {
                return this.positive.docIds.length + this.negative.docIds.length;
            },
        };
    }

    /////////////////////////////////////////////
    // HELPER FUNCTIONS
    /////////////////////////////////////////////

    /** Sets the feature space. */
    async _setFeatureSpace() {
        // get the model parameters
        const params = this.getParams();
        // define the feature space
        this.featureSpace = new qm.FeatureSpace(this.base, [
            {
                type: "text",
                source: "Dataset",
                field: params.fields,
                ngrams: 1,
                tokenizer: {
                    type: "simple",
                    stopwords: {
                        language: "en",
                        words: [""],
                        ...params.processing.stopwords,
                    },
                },
            },
        ]);
        // update the feature space
        const elements = this.subset.hasElements;
        await setImmediateP(this.featureSpace.updateRecords(elements));
        // get the document feature matrix
        this.featureMatrix = this.featureSpace.extractSparseMatrix(elements);
    }

    /** Initializes the active learning model. */
    _initializeModel() {
        // initialize the model
        this.model = new qm.analytics.ActiveLearner({
            learner: { disableAsserts: true },
            SVC: {
                algorithm: "LIBSVM",
                c: 2, // cost parameter
                j: 2, // unbalance parameter
                eps: 1e-4, // epsilon insensitive loss parameter
                batchSize: 1000,
                maxIterations: 10000,
                maxTime: 60, // maximum runtime in seconds
                minDiff: 1e-6, // stopping criterion tolerance
                type: "C_SVC",
                kernel: "RBF", // radial basis function kernel (makes loops)
                gamma: 2.0, // designates the tail of the normal distribution
                coef0: 2.0, // scaling parameter
            },
        });
        // set the initial matrix and labels for the model
        this.model.setX(this.featureMatrix as qm.la.SparseMatrix);
        const labels = new Array(this.subset.hasElements.length).fill(0);
        this.model.sety(new qm.la.IntVector(labels));
    }

    /**
     * Retrieves the initial documents used to label the documents.
     * @param maxCount - The maximum number of documents in a batch.
     */
    *_initialDocuments(maxCount = 10) {
        // get the model parameters
        const params = this.getParams();
        // prepare the default generator values
        const query = params.method.query;
        let ascendingOrder = false;
        let nGenerated = 0;
        let docOffset = 0;

        let positiveExamples = 0;
        let negativeExamples = 0;

        // TODO: improve initial document retrieval
        let documentIds: IDocument[] = [];
        for (let i = 0; i < this.subset.hasElements.length; i++) {
            if (!ascendingOrder && this.labelCount.positive > 2) {
                ascendingOrder = true;
                nGenerated = 0;
                docOffset = negativeExamples;
            } else if (ascendingOrder && this.labelCount.positive < 3) {
                ascendingOrder = false;
                nGenerated = 0;
                docOffset = positiveExamples;
            }
            // get the index of the document we want to return
            const id = nGenerated % maxCount;
            if (id === 0) {
                const results = this._search(query, maxCount, docOffset, ascendingOrder);
                documentIds = results.map((rec) => rec.$id);
                // the next search batch will start from the end of the last batch
                docOffset += results.length;
            }
            nGenerated++;
            // track the number of positive and negative examples that were processed
            !ascendingOrder ? positiveExamples++ : negativeExamples++;
            yield documentIds[id];
        }
    }

    /** Get the next uncertain document. */
    _uncertainDocument() {
        const idx = this.model?.getQueryIdx(1)[0] as number;
        const document = this.elements[idx] as qm.Record;
        const documentId = document.$id;
        return documentId;
    }

    /** Assigns the next document. */
    _assignNextDocument() {
        const params = this.getParams();
        if (!params.method.documents) {
            params.method.documents = {
                labelled: [],
            };
        }
        if (!this.isModelInit) {
            if (this.labelCount.positive > 2 && this.labelCount.negative > 2) {
                this.model?.retrain();
                this.isModelInit = true;
                // return the next uncertain document
                const documentId = this._uncertainDocument() as number;
                params.method.documents.next = { documentId, label: null };
                this.method.parameters = params;
                return this;
            }
            // return the next initial document
            const documentId = this.docGenerator.next().value as number;
            params.method.documents.next = { documentId, label: null };
            this.method.parameters = params;
            return this;
        }
        // retrain the model
        this.model?.retrain();
        // return the next uncertain document
        const documentId = this._uncertainDocument() as number;
        params.method.documents.next = { documentId, label: null };
        this.method.parameters = params;
    }

    /**
     * Searches for the most similar documents based on the selected features.
     * @param query - The query string.
     * @param maxCount - The maximum number of documents to be retrieved.
     * @param offset - The offset; where to start the retrieval process.
     * @param ascending - If we want to sort the documents in ascending order (based on its similarities).
     */
    _search(query: string, maxCount = 100, offset = 0, ascending = false) {
        // get the model parameters
        const params = this.getParams();
        // transform the query json into a sparse vector
        const defaultField = params.fields as string[];
        const record = this.base.store("Dataset").newRecord({
            [defaultField[0]]: query,
        });
        const vector = this.featureSpace?.extractSparseVector(record) as qm.la.SparseVector;
        // calculate the similarities and create the document set
        const sim = this.featureMatrix?.multiplyT(vector) as qm.la.Vector;
        const sort = sim.sortPerm(ascending);
        const idVec = new qm.la.IntVector();
        // prepare the iteration conditions
        let upperLimit = maxCount + offset;
        if (upperLimit > sort.perm.length) {
            upperLimit = sort.perm.length;
        }
        // store the document IDs
        const elements = this.subset.hasElements;
        for (let i = offset; i < upperLimit; i++) {
            idVec.push(elements[sort.perm[i]]?.$id as number);
        }
        // return the document set
        return this.base.store("Dataset").newRecordSet(idVec);
    }

    /** Gets the predicted subset statistics. */
    _getSubsetStatistics() {
        // get the model and predict the labels for the documents
        const svc = this.model?.getSVC();
        const predictions = svc?.predict(this.featureMatrix as qm.la.SparseMatrix) as qm.la.Vector;
        // set the positive and negative prediction containers
        const positiveDocIDs = new qm.la.IntVector();
        const negativeDocIDs = new qm.la.IntVector();

        // set the positive and negative prediction containers
        const positivePosIDs = new qm.la.IntVector();
        const negativePosIDs = new qm.la.IntVector();

        // iterate through all of the predictions
        for (let i = 0; i < predictions.length; i++) {
            const docId = (this.elements[i] as qm.Record).$id;
            if (this.positiveDocs.includes(docId) || predictions[i] > 0) {
                positiveDocIDs.push(docId);
                positivePosIDs.push(i);
            } else if (this.negativeDocs.includes(docId) || predictions[i] < 0) {
                negativeDocIDs.push(docId);
                negativePosIDs.push(i);
            }
        }
        // get the positive and negative documents
        const positiveDocs = this.base.store("Dataset").newRecordSet(positiveDocIDs);
        const negativeDocs = this.base.store("Dataset").newRecordSet(negativeDocIDs);

        /**
         * Calculates the average similarity.
         * @param posIDs - The position IDs.
         */
        const getDistances = (posIDs: qm.la.IntVector) => {
            // get the number of documents and their feature matrix
            const length = posIDs.length;
            const submatrix = this.featureMatrix?.getColSubmatrix(posIDs);
            const onesVec = new qm.la.Vector(new Array(length).fill(1));
            // get the centroid
            const centroid = submatrix?.multiply(onesVec).multiply(1 / length) as qm.la.Vector;
            // get the distances
            let dists = submatrix?.multiplyT(centroid) as qm.la.Vector;
            dists = qm.la.ones(dists.length).minus(dists);
            // calculate the statistics
            const mean = qm.statistics.mean(dists) as number;
            const std = qm.statistics.std(dists) as number;
            const max = dists[dists.getMaxIdx()];
            const min = dists[dists.multiply(-1).getMaxIdx()];
            return { mean, std, max, min };
        };

        /**
         * Gets the features and their weights.
         * @param type - The string specifying the type of features.
         * @param maxCount - The maximum number of features.
         */
        const getFeatures = (type = "positive", maxCount = 100) => {
            // assign the features placeholder
            const features: { feature: string; weight: number }[] = [];
            // get the model weights and sort them accordingly
            const weights = svc?.weights as qm.la.Vector;
            const order = type === "positive" ? false : true;
            const sort = weights.sortPerm(order);
            const limit = sort.perm.length / 2 < maxCount ? sort.perm.length / 2 : maxCount;
            // iterate through the features and store them
            for (let i = 0; i < limit; i++) {
                const [weight, id] = [sort.vec[i], sort.perm[i]];
                const feature = this.featureSpace?.getFeature(id) as string;
                if ((!order && weight < 0) || (order && weight > 0)) {
                    break;
                }
                // add the feature and weight
                features.push({ feature, weight });
            }
            return features;
        };
        // return the statistics
        return {
            positive: {
                docIds: positiveDocs.map((rec) => rec.$id),
                distances: getDistances(positivePosIDs),
                features: getFeatures("positive"),
                subsetId: -1,
            },
            negative: {
                docIds: negativeDocs.map((rec) => rec.$id),
                distances: getDistances(negativePosIDs),
                features: getFeatures("negative"),
                subsetId: -1,
            },
        };
    }

    /**
     * Handles the error.
     * @param error - The error object.
     */
    _handleError(error: Error) {
        // set the method status
        this.method.status = EMethodStatus.ERROR;
        throw new BadRequest(error.message);
    }
}
