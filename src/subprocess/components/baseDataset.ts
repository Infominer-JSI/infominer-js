import {
    IField,
    EBaseMode,
    IBaseDatasetParams,
    IBaseDatasetField,
    IFileMetadata,
    EAggregateType,
    ISubsetCreateParams,
    ISubsetUpdateParams,
    IBaseDatasetUpdateParams,
    EMethodType,
    IMethodCreateParams,
    IBaseProcessing,
    EMethodStatus,
    IMethodRecord,
    IMethodUpdateParams,
} from "../../interfaces";

// static values
import { LABEL2ID, ID2TYPE } from "../../config/static";

import qm from "qminer";
import fs from "fs";
import path from "path";
import parse from "csv-parse";
// directory creation functions
import { createDirectory, removeFile } from "../../utils/FileSystem";
import { copy } from "./utils/utils";

// import formatter
import formatter from "./formatter";

// import subset and model managers
import SubsetManager from "./subsetManager";
import MethodManager from "./methodManager";
import DocumentManager from "./documentManager";

// initialize subset and model managers
const subsetManager = new SubsetManager(formatter);
const methodManager = new MethodManager(formatter);
const documentManager = new DocumentManager(formatter);
export default class BaseDataset {
    private base: qm.Base | undefined;
    private dbpath: string;
    private fields: IBaseDatasetField[];
    private processing: IBaseProcessing;
    private metadata: IBaseDatasetParams["metadata"];

    constructor(params: IBaseDatasetParams) {
        // initialize all required parameters
        this.dbpath = params.dbpath;
        // load the database
        this._loadBase(params.mode, params.fields);
        // load the field metadata
        this.fields = this._getFieldMetadata(params.fields);
        // store preprocessing information
        this.processing = {
            stopwords: {
                language: "none",
                words: [""],
                ...(params.processing && { ...params.processing.stopwords }),
            },
        };
        // contains database metadata
        this.metadata = params.metadata;
    }

    /////////////////////////////////////////////
    // BASE HANDLERS
    /////////////////////////////////////////////

    /**
     * Loads the base.
     * @param mode - The mode in which the base is created.
     * @param fields - The user defined fields.
     */
    _loadBase(mode: EBaseMode, fields?: IField[]) {
        // the base is held in its `db` folder
        const dbPath = path.resolve(this.dbpath, "db");
        if (mode === EBaseMode.CREATE_CLEAN) {
            // create a new QMiner base
            createDirectory(dbPath);
            const schema = this._prepareSchema(fields as IField[]);
            this.base = new qm.Base({ mode, dbPath, schema });
        } else if (mode === EBaseMode.OPEN) {
            // remove any possible lock files in the database
            removeFile(path.resolve(dbPath, "lock"));
            // open an existing QMiner base
            this.base = new qm.Base({ mode, dbPath });
            // clean any unprocessed methods
            const methodRecs = this.base.store("Methods").allRecords;
            methodRecs
                .filter((rec) =>
                    [EMethodStatus.IN_QUEUE, EMethodStatus.TRAINING].includes(rec.status)
                )
                .each((rec) => {
                    rec.status = EMethodStatus.ERROR;
                });
        } else {
            throw Error(`Invalid base mode; mode=${mode}`);
        }
    }

    /**
     * Prepares base schema.
     * @param fields - The user defined fields.
     */
    _prepareSchema(fields: IField[]) {
        // read the file and parse it as a json
        const file = fs.readFileSync(path.resolve(__dirname, "schema", "dataset.json"), "utf8");
        const schema = JSON.parse(file);

        // assign the fields
        schema[0].fields = fields
            .filter((field) => field.included)
            .map((field) => ({
                name: field.name,
                type: ID2TYPE[LABEL2ID[field.type]],
                null: true,
            }));

        // assign the keys
        const keys = [];
        for (const field of schema[0].fields) {
            // string fields are used for keys
            if (field.type === "string") {
                keys.push({ field: field.name, type: "text_position" });
            } else if (field.type === "float" || field.type === "datetime") {
                keys.push({ field: field.name, type: "linear" });
            } else if (field.type === "string_v") {
                keys.push({ field: field.name, type: "value" });
            }
        }
        // add keys to the schema
        if (keys.length) {
            schema[0].keys = keys;
        }
        return schema;
    }

    /** Prepares the base field metadata. */
    _getFieldMetadata(fileFields: IField[]) {
        // get the field metadata
        const fields = this.base?.store("Dataset").fields.map((field) => {
            const fileField = fileFields.filter((f) => f.name === field.name);
            return { ...field, group: fileField[0].type };
        }) as IBaseDatasetField[];
        // add the field aggregates
        fields.forEach((field) => {
            switch (field.group) {
                case "number":
                    field.aggregate = EAggregateType.HISTOGRAM;
                    break;
                case "text":
                    field.aggregate = EAggregateType.KEYWORDS;
                    break;
                case "class":
                    field.aggregate = EAggregateType.COUNT;
                    break;
                case "category":
                    field.aggregate = EAggregateType.HIERARCHY;
                    break;
                case "datetime":
                    field.aggregate = EAggregateType.TIMELINE;
                    break;
                default:
                    break;
            }
        });
        return fields;
    }

    /** Closes the base. */
    close() {
        this.base?.close();
    }

    /** Gets the dataset ID. */
    getID() {
        return this.metadata.id;
    }

    /** Gets the qminer base. */
    getBase() {
        return this.base;
    }

    /** Gets the base path. */
    getDBPath() {
        return this.dbpath;
    }

    /** Get the dataset metadata. */
    getMetadata() {
        return this.metadata;
    }

    /** Get the base fields. */
    getFields() {
        return this.fields;
    }

    /**
     * Updates the dataset metadata.
     * @param dataset - The dataset metadata.
     */
    updateDataset(dataset: IBaseDatasetUpdateParams) {
        for (const [key, value] of Object.entries(dataset)) {
            switch (key) {
                case "name":
                    this.metadata[key] = value as string;
                    break;
                case "description":
                    this.metadata[key] = value as string | null;
                    break;
                default:
                    break;
            }
        }
        // return the updated metadata
        return {
            datasets: this._formatDataset(),
        };
    }

    /**
     * Gets the dataset metadata, subsets and methods.
     */
    getDataset() {
        return {
            datasets: this._formatDataset(),
            ...subsetManager.getSubsets(this.base as qm.Base),
            ...methodManager.getMethods(this.base as qm.Base),
        };
    }

    /**
     * Formats the dataset object in a consistent way.
     */
    _formatDataset() {
        return {
            id: this.metadata.id,
            type: "dataset",
            name: this.metadata.name,
            description: this.metadata.description,
            nDocuments: this.base?.store("Dataset").length,
            created: this.metadata.created,
            fields: this.fields.map((field) => ({
                name: field.name,
                type: field.type,
                group: field.group,
            })),
        };
    }

    /////////////////////////////////////////////
    // RECORD HANDLERS
    /////////////////////////////////////////////

    /**
     * Populates the base with the examples in the file.
     * @param file - The object containing the dataset metadata.
     */
    populateBase(file: IFileMetadata) {
        return new Promise<boolean>((resolve, reject) => {
            // prepare the parser
            const parser = parse({
                delimiter: file.delimiter,
                trim: true,
                skip_lines_with_error: true,
            });
            // handle each readable row
            parser.on("readable", () => {
                let record;
                while ((record = parser.read())) {
                    // create a new document
                    this.createDocument(record, file.fields);
                }
            });
            // handle parser errors
            parser.on("error", (error) => {
                return reject(error);
            });
            // handle on parser end
            parser.on("end", () => {
                // prepare subset metadata
                const subset = {
                    label: "root",
                    description: "The root subset. Contains all records of the dataset.",
                    documents: this.base?.store("Dataset").allRecords,
                };
                // create a subset record
                this.createSubset(subset);
                return resolve(true);
            });
            // read file and skip first line
            const fileIn = qm.fs.openRead(file.filepath);
            fileIn.readLine();

            // go through the whole file and parse it
            while (!fileIn.eof) {
                // add end-of-line tag for the parser
                const line = fileIn.readLine() + "\n";
                parser.write(line);
            }
            // close the parser
            parser.end();
        });
    }

    /////////////////////////////////////////////
    // SUBSET HANDLERS
    /////////////////////////////////////////////

    /**
     * Gets all subsets.
     */
    getSubsets() {
        return subsetManager.getSubsets(this.base as qm.Base);
    }

    /**
     * Creates a new subset and its statistics method.
     * @param subset - Subset metadata.
     */
    async createSubset(subset: ISubsetCreateParams) {
        // create the subset record
        const subsetId = subsetManager.createSubset(this.base as qm.Base, subset);
        // calculate the statistics of the subset
        await methodManager.createMethod(
            this.base as qm.Base,
            { type: EMethodType.AGGREGATE, parameters: { subsetId, processing: this.processing } },
            this.fields
        );
        // return the subset metadata
        return this.getSubset(subsetId);
    }

    /**
     * Gets the specific subset.
     * @param subsetId - The subset ID.
     */
    getSubset(subsetId: number) {
        return subsetManager.getSubset(this.base as qm.Base, subsetId);
    }

    /**
     * Updates the subset with the new metadata.
     * @param subsetId - The Subset ID.
     * @param subset - The subset metadata.
     */
    updateSubset(subsetId: number, subset: ISubsetUpdateParams) {
        return subsetManager.updateSubset(this.base as qm.Base, subsetId, subset);
    }

    /**
     * Deletes the subset and all its associated methods.
     * @param subsetId - The subset ID.
     */
    deleteSubset(subsetId: number) {
        return subsetManager.deleteSubset(
            this.base as qm.Base,
            subsetId,
            methodManager.deleteMethod.bind(methodManager)
        );
    }

    /**
     * Downloads the file containing the subset documents.
     * @param subsetId - The subset ID.
     */
    downloadSubset(subsetId: number) {
        return subsetManager.downloadSubset(this.base as qm.Base, subsetId, this.fields);
    }

    /////////////////////////////////////////////
    // METHOD HANDLERS
    /////////////////////////////////////////////

    /**
     * Gets all methods.
     */
    getMethods() {
        return methodManager.getMethods(this.base as qm.Base);
    }

    /**
     * Gets a specific method.
     * @param methodId - The method ID.
     */
    getMethod(methodId: number) {
        return methodManager.getMethod(this.base as qm.Base, methodId);
    }

    /**
     * Creates a new method.
     * @param method - The method parameters.
     */
    async createMethod(method: IMethodCreateParams) {
        // update the method parameters with the base processing
        const stopwords = copy(this.processing.stopwords);
        if (method.parameters.processing?.stopwords?.words) {
            stopwords.words.push(...method.parameters.processing.stopwords.words);
            // override the method with the combination of default and method specific stopwords
            method.parameters.processing.stopwords = stopwords;
        } else if (!method.parameters.processing?.stopwords) {
            method.parameters.processing.stopwords = stopwords;
        } else if (!method.parameters.processing) {
            method.parameters.processing = { stopwords };
        }

        // create a new method
        const { methods } = await methodManager.createMethod(
            this.base as qm.Base,
            method,
            this.fields
        );
        // if the method is finished: create the subsets
        if (methods.status === EMethodStatus.FINISHED) {
            await this._finalizeMethod(methods);
        }
        // return the created method
        return this.getMethod(methods.$id);
    }

    /**
     * Updates an existing method.
     * @param methodId - The method ID.
     * @param method - The method update parameters.
     */
    async updateMethod(methodId: number, method: IMethodUpdateParams) {
        // create a new method
        const { methods } = await methodManager.updateMethod(
            this.base as qm.Base,
            methodId,
            method
        );
        // if the method is finished: create the subsets
        if (methods.status === EMethodStatus.FINISHED) {
            await this._finalizeMethod(methods);
        }
        // return the updated method
        return this.getMethod(methods.$id);
    }

    /**
     * Deletes the methods and all its assocaited subsets.
     * @param methodId - The method ID.
     */
    deleteMethod(methodId: number) {
        return methodManager.deleteMethod(
            this.base as qm.Base,
            methodId,
            subsetManager.deleteSubset.bind(subsetManager)
        );
    }

    /**
     * Finalize the method creation.
     * @param method - The method record.
     */
    async _finalizeMethod(method: IMethodRecord) {
        switch (method.type) {
            case EMethodType.CLUSTERING_KMEANS:
                // create the cluster subsets
                await this._clusteringKMeansSubsets(method);
                break;
            case EMethodType.ACTIVE_LEARNING:
                // create the active learning subsets
                await this._activeLearningSubsets(method);
                break;
        }
    }

    /**
     * Creates a subset for each cluster.
     * @param method - The method record.
     */
    async _clusteringKMeansSubsets(method: IMethodRecord) {
        const result = method.result;
        for (const cluster of result?.clusters) {
            // assign the subset ID to the cluster
            cluster.subsetId = await this._createMethodSubset(cluster, method);
        }
        if (result?.empty) {
            // assign the empty cluster subset
            result.empty.subsetId = await this._createMethodSubset(
                { label: "EMPTY CLUSTER", docIds: result.empty.docIds },
                method
            );
        }
        // reassign the results
        method.result = result;
    }

    /**
     * Creates a subset for each active learning subset.
     * @param method - The method record.
     */
    async _activeLearningSubsets(method: IMethodRecord) {
        // create the subsets
        const result = method.result as any;
        result.positive.subsetId = await this._createMethodSubset(result.positive, method);
        result.negative.subsetId = await this._createMethodSubset(result.negative, method);
        method.result = result;
    }

    /**
     * Creates the subset associated to the model.
     * @param label - The subset label.
     * @param method - The method that created the subset.
     * @param docIds - The array of document IDs.
     */
    async _createMethodSubset(metadata: any, method: IMethodRecord) {
        const label = metadata.features
            ? metadata.features
                  .slice(0, 4)
                  .map((obj: any) => obj.feature)
                  .join(", ")
            : metadata.label;
        // get the cluster documents
        const documents = this.base
            ?.store("Dataset")
            .newRecordSet(new qm.la.IntVector(metadata.docIds));
        // create the new subset
        const { subsets } = await this.createSubset({
            label: label,
            resultedIn: method,
            documents,
        });
        return subsets.id;
    }

    /////////////////////////////////////////////
    // DOCUMENT HANDLERS
    /////////////////////////////////////////////

    /**
     * Creates a new document.
     * @param record - The record containing the document values.
     * @param fields - The fields used to create the document.
     */
    createDocument(record: any, fields: IField[]) {
        const documentId = documentManager.createDocument(this.base as qm.Base, record, fields);
        return documentId;
    }

    /**
     * Gets the specific document.
     * @param documentId - The document ID.
     */
    getDocuments(query: any) {
        // add dataset processing parameters
        query.processing = this.processing;
        return documentManager.getDocuments(this.base as qm.Base, query, this.fields);
    }

    /**
     * Gets the specific document.
     * @param documentId - The document ID.
     */
    getDocument(documentId: number) {
        return documentManager.getDocument(this.base as qm.Base, documentId);
    }

    /**
     * Gets the specific document.
     * @param documentId - The document ID.
     * @param params - The document parameters.
     */
    updateDocument(documentId: number, params: any) {
        return documentManager.updateDocument(this.base as qm.Base, documentId, params);
    }
}
