import {
    IField,
    EBaseMode,
    IBaseDatasetParams,
    IBaseDatasetField,
    IFileMetadata,
    EAggregateType,
} from "../../interfaces";

// static values
import { ID2LABEL, LABEL2ID, ID2TYPE, TYPE2ID } from "../../config/static";

import qm from "qminer";
import fs from "fs";
import path from "path";
import parse from "csv-parse";
// directory creation functions
import { createDirectory } from "../../utils/FileSystem";

// import formatter
import formatter from "./formatter";

// import subset and model managers
import SubsetManager from "./subsetManager";
import ModelManager from "./modelManager";

// initialize subset and model managers
const subsetManager = new SubsetManager(formatter);
const modelManager = new ModelManager(formatter);

export default class BaseDataset {
    private base: qm.Base | undefined;
    private dbpath: string;
    private fields: IBaseDatasetField[];
    private preprocessing: IBaseDatasetParams["preprocessing"];

    public metadata: IBaseDatasetParams["metadata"];

    constructor(params: IBaseDatasetParams) {
        // initialize all required parameters
        this.dbpath = params.dbpath;
        // load the database
        this._loadBase(params.mode, params.fields);
        // load the field metadata
        this.fields = this._getFieldMetadata();
        // store preprocessing information
        this.preprocessing = {
            stopwords: {
                language: "en",
                words: [""],
            },
            ...params.preprocessing,
        };
        // contains database metadata
        this.metadata = params.metadata;
    }

    /////////////////////////////////////////////
    // BASE METHODS
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
            // open an existing QMiner base
            this.base = new qm.Base({ mode, dbPath });
        } else {
            throw Error("invalid base mode");
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
    _getFieldMetadata() {
        // get the field metadata
        const fields = this.base?.store("Dataset").fields as IBaseDatasetField[];
        fields.forEach((field) => {
            switch (ID2LABEL[TYPE2ID[field.type]]) {
                case "number":
                    field.aggregate = EAggregateType.HISTOGRAM;
                    break;
                case "text":
                    field.aggregate = EAggregateType.KEYWORDS;
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

    /////////////////////////////////////////////
    // RECORD METHODS
    /////////////////////////////////////////////

    /**
     * Populates the base with the examples in the file.
     * @param file - The object containing the dataset metadata.
     */
    populateBase(file: IFileMetadata) {
        return new Promise<any>((resolve, reject) => {
            // prepare the parser
            const parser = parse({
                delimiter: file.delimiter,
                trim: true,
                skip_lines_with_error: true,
            });
            // handle each readable row
            parser.on("readable", () => {
                let record;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                while ((record = parser.read())) {
                    // prepare and push record to dataset
                    const rec = this._formatRecord(record, file.fields);
                    this.base?.store("Dataset").push(rec);
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
                const subsetId = subsetManager.createSubset(this.base as qm.Base, subset);
                // TODO: update subset metadata
                modelManager.aggregate(this.base as qm.Base, subsetId, this.fields);
                return resolve({});
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

    /**
     * Formats the record for the base.
     * @param values - The record values.
     * @param fields - The base fields.
     */
    _formatRecord(values: string[], fields: IField[]) {
        const record: { [key: string]: number | number[] | string | string[] | null } = {};
        for (let i = 0; i < fields.length; i++) {
            const value = values[i];
            const field = fields[i];
            if (field.included) {
                record[field.name] = this._parseValue(value, field.type);
            }
        }
        return record;
    }

    /**
     * Parses the value based on its type.
     * @param value - The record value.
     * @param type - The value type.
     */
    _parseValue(value: string, type: string) {
        // handle empty values
        if (this._isValueEmpty(value)) {
            return null;
        }
        // otherwise parse the value based on its type
        switch (type) {
            case "text":
                return value;
            case "number":
                return parseFloat(value);
            case "datetime":
                return new Date(value).toISOString();
            case "category":
                return value.split(/[\\/]/g);
            default:
                throw new Error('Type is not "text", "number", "datetime" or "category"');
        }
    }

    /** Checks if the value is empty. */
    _isValueEmpty(value: string) {
        return value === null || value === "";
    }

    /////////////////////////////////////////////
    // SUBSET METHODS
    /////////////////////////////////////////////

    /////////////////////////////////////////////
    // MODEL METHODS
    /////////////////////////////////////////////
}
