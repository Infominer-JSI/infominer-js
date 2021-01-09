import { IField } from "../../interfaces";

import qm from "qminer";
import fs from "fs";
import path from "path";
import { createDirectory } from "../../utils/FileSystem";
import { LABEL2ID, ID2TYPE } from "../../config/defaults";

export default class BaseDataset {
    private stopwords: string[];
    private params: any;
    private base: qm.Base | undefined;

    constructor(params: any) {
        this.stopwords = [];
        this.params = params;
        this._loadBase(this.params.fields);
    }

    // load base
    _loadBase(fields: IField[]) {
        if (this.params.mode === "createClean") {
            createDirectory(this.params.dbpath);
            const schema = this._prepareSchema(fields);
            this.base = new qm.Base({ mode: this.params.mode, dbPath: this.params.dbpath, schema });
        } else if (this.params.mode === "open") {
            this.base = new qm.Base({ mode: this.params.mode, dbPath: this.params.dbpath });
        } else {
            // TODO: handle error
        }
    }

    // prepare base schema
    _prepareSchema(fields: IField[]) {
        // read the file and parse it as a json
        const file = fs.readFileSync(path.resolve(__dirname, "schema", "dataset"), "utf8");
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

    // prepares the record from the row
    _prepareRecord(values: string[], fields: IField[]) {
        const record: { [key: string]: string | number | string[] | null } = {};
        for (let i = 0; i < fields.length; i++) {
            const value = values[i];
            const field = fields[i];
            if (field.included) {
                record[field.name] = this._parseValue(value, field.type);
            }
        }
        return record;
    }

    // parse field
    _parseValue(value: string, type: string) {
        switch (type) {
            case "text":
                return value && value !== "" ? value : null;
            case "number":
                return value && value !== "" ? parseFloat(value) : null;
            case "datetime":
                return value && value !== "" ? new Date(value).toISOString() : null;
            case "category":
                return value && value !== "" ? value.split(/[\\/]/g) : null;
            default:
                throw new Error('Type is not "text", "number", "datetime" or "category"');
        }
    }

    // close the database
    close() {
        this.base?.close();
    }
}
