import {
    EMethodStatus,
    EMethodType,
    IALearnModelParams,
    IALearnUpdateParams,
    IDocumentFormatter,
    IDocumentRecord,
    IFormatter,
    ISubsetRecord,
} from "../../../interfaces";

import qm from "qminer";
import ModelBasic from "./ModelBasic";

// get the promise version of setImmediate
import { promisify } from "util";
const setImmediateP = promisify(setImmediate);

export default class ActiveLearning extends ModelBasic {
    private result: { [key: string]: any };
    private featureSpace: qm.FeatureSpace | null;
    private featureMatrix: qm.la.SparseMatrix | null;
    private model: qm.analytics.ActiveLearner | null;
    private elements: qm.RecordSet;
    private formatter: IFormatter;
    private modelInit: boolean;
    private labelCount: { positive: number; negative: number };
    private positiveDocs: number[];
    private negativeDocs: number[];

    /**
     * Creates a new ActiveLearning instance.
     * @param base - The QMiner base.
     * @param subset - The subset.
     * @param params - The model parameters.
     */
    constructor(
        base: qm.Base,
        subset: ISubsetRecord,
        params: IALearnModelParams,
        formatter: IFormatter
    ) {
        super(base, subset, params, EMethodType.ACTIVE_LEARNING);
        this.formatter = formatter;
        this.featureSpace = null;
        this.featureMatrix = null;
        this.model = null;
        this.result = {};
        // get the document elements
        this.elements = this.subset.hasElements;
        // prepare labelling placeholders
        this.modelInit = false;
        this.labelCount = {
            positive: 0,
            negative: 0,
        };
        this.positiveDocs = [];
        this.negativeDocs = [];
    }

    /** Initializes the model. */
    async init(): Promise<ActiveLearning> {
        // set the feature space
        await this._setFeatureSpace();
        // initialize the model
        this._initializeModel();

        return this;
    }

    /**
     * Updates the active learning model.
     * @param params - The update parameters.
     */
    async update(params: IALearnUpdateParams): Promise<IDocumentFormatter> {
        // get the parameter information
        const {
            next: { document, label },
        } = params.method.documents;
        // find the document within the elements
        for (let i = 0; i < this.elements.length; i++) {
            const element = this.elements[i] as qm.Record;
            if (element.$id === document.id) {
                this.model?.setLabel(i, label);
                // update the method parameters
                const parameters = this.method.parameters;
                parameters.labelled.push({ document, label });
                this.method.parameters = parameters;
                // update the model parameters
                if (label > 0) {
                    this.labelCount.positive++;
                    this.positiveDocs.push(element.$id);
                } else if (label < 0) {
                    this.labelCount.negative++;
                    this.negativeDocs.push(element.$id);
                }
                break;
            }
        }
        if (!this.modelInit) {
            if (this.labelCount.positive > 2 && this.labelCount.negative > 2) {
                this.model?.retrain();
                this.modelInit = true;
                // return the next uncertain document
                return this._uncertainDocument();
            }
            // return the next initial document
            return this._initialDocuments().next().value as IDocumentFormatter;
        }
        // retrain the model
        this.model?.retrain();
        // return the next uncertain document
        return this._uncertainDocument();
    }

    /** Trains the model. */
    train(): ActiveLearning {
        // set the method status
        this.method.status = EMethodStatus.LOADING;
        // get the aggregates of the subset
        // set the method results
        this.method.result = this.result;
        this.method.status = EMethodStatus.FINISHED;
        return this;
    }

    /** Get the method parameters. */
    getParams() {
        return this.params as IALearnModelParams;
    }

    /** Checks if the models was initialized or not. */
    isModelInit() {
        return this.isModelInit;
    }

    /** Get the statistics. */
    statistics() {
        return {
            labelCount: this.labelCount,
            predicted: {},
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
                eps: 1e-3, // epsilon insensitive loss parameter
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

        let documents: IDocumentFormatter[] = [];
        for (let i = 0; i < this.subset.hasElements.length; i++) {
            if (!ascendingOrder && this.labelCount.positive > 2) {
                ascendingOrder = true;
                nGenerated = 0;
                docOffset = 0;
            }
            // get the index of the document we want to return
            const id = nGenerated % maxCount;
            if (id) {
                const results = this._search(query, maxCount, docOffset, ascendingOrder);
                documents = results.map((rec) => this.formatter.document(rec as IDocumentRecord));
                // the next search batch will start from the end of the last batch
                docOffset += results.length;
            }
            nGenerated++;
            yield documents[id];
        }
    }

    /** Get the next uncertain document. */
    _uncertainDocument() {
        const idx = this.model?.getQueryIdx(1)[0] as number;
        const document = this.formatter.document(this.elements[idx] as IDocumentRecord);
        return document;
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
}
