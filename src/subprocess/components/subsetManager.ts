import {
    IBaseDatasetField,
    IDocumentRecord,
    IFormatter,
    IMethodFormatter,
    IMethodRecord,
    ISubsetCreateParams,
    ISubsetFormatter,
    ISubsetRecord,
    ISubsetUpdateParams,
} from "../../interfaces";

import qm from "qminer";
import fs from "fs";
import { resolve } from "path";

import { TMP_DOWNLOAD_PATH } from "../../config/static";
import { BadRequest } from "../../utils/ErrorDefs";

export default class SubsetManager {
    private formatter: IFormatter;

    /**
     * Creates a new SubsetManager instance.
     * @param formatter - The formating functions.
     */
    constructor(formatter: IFormatter) {
        this.formatter = formatter;
    }

    /////////////////////////////////////////////
    // SUBSET HANDLERS
    /////////////////////////////////////////////

    /**
     * Creates a new subset.
     * @param base - The base containing the subset records.
     * @param subset - The subset metadata object.
     */
    createSubset(base: qm.Base, subset: ISubsetCreateParams) {
        // get the subset attributes
        const { label, description, resultedIn, documents } = subset;
        // create a new subset record
        const subsetId = base.store("Subsets").push({ label, ...(description && { description }) });
        if (resultedIn && !resultedIn.deleted) {
            // join the method with the subset
            base.store("Subsets")[subsetId]?.$addJoin("resultedIn", resultedIn);
        }
        if (documents) {
            // join the documents with the subset
            documents.each((doc) => {
                base.store("Subsets")[subsetId]?.$addJoin("hasElements", doc);
            });
        }
        // return the subset metadata
        return subsetId;
    }

    /**
     * Gets all non-deleted subsets.
     * @param base - The qminer base.
     */
    getSubsets(base: qm.Base) {
        const subsets = base.store("Subsets").allRecords;
        if (subsets && !subsets.empty && subsets[0] && subsets[0].deleted !== undefined) {
            subsets.filterByField("deleted", false);
        }
        return {
            subsets: subsets.map((rec) =>
                this.formatter.subset(rec as ISubsetRecord)
            ) as ISubsetFormatter[],
        };
    }

    /**
     * The subset metadata.
     * @param base - The qminer base.
     * @param subsetId - The subset id.
     */
    getSubset(base: qm.Base, subsetId: number) {
        /**
         * Gets all of the undeleted records.
         * @param recordSet - The methods record set.
         */
        const getSubsetMethods = (recordSet: qm.RecordSet) => {
            if (!recordSet.empty && recordSet[0] && recordSet[0].deleted !== undefined) {
                recordSet.filterByField("deleted", false);
            }
            return recordSet;
        };
        if (!Number.isInteger(subsetId)) {
            throw new BadRequest(`Invalid subset id; subsetId=${subsetId}`);
        }
        // get the subset record
        const subset = base.store("Subsets")[subsetId] as ISubsetRecord;
        if (!subset || subset.deleted) {
            throw new BadRequest(`Subset does not exist; subsetId=${subsetId}`);
        }
        // prepare the response
        const response = {
            subsets: this.formatter.subset(subset),
            methods: [] as IMethodFormatter[],
        };
        // get all associated methods
        if (subset.resultedIn) {
            response.methods.push(this.formatter.method(subset.resultedIn as IMethodRecord));
        }
        if (subset.usedBy && !subset.usedBy?.empty) {
            const usedBy = getSubsetMethods(subset.usedBy);
            response.methods.push(
                ...usedBy.map((rec) => this.formatter.method(rec as IMethodRecord))
            );
        }
        return response;
    }

    /**
     * Updates the subset with the provided values.
     * @param base - The qminer base.
     * @param subsetId - The subset ID.
     * @param subset - The subset metadata.
     */
    updateSubset(base: qm.Base, subsetId: number, subset: ISubsetUpdateParams) {
        if (!Number.isInteger(subsetId)) {
            throw new BadRequest(`Invalid subset; subsetId=${subsetId}`);
        }
        const record = base.store("Subsets")[subsetId] as ISubsetRecord;
        if (!record || record.deleted) {
            throw new BadRequest(`Subset does not exist; subsetId=${subsetId}`);
        }
        for (const [key, value] of Object.entries(subset)) {
            switch (key) {
                case "label":
                    record[key] = value as string;
                    break;
                case "description":
                    record[key] = value as string | null;
                    break;
                default:
                    break;
            }
        }
        // return the new subset metadata
        return { subsets: this.formatter.subset(record) };
    }

    /**
     * Deletes the subsets and its associated methods.
     * @param base - The qminer base.
     * @param subsetId - The subset ID.
     * @param callback - The callback used to delete methods that used the subset.
     */
    deleteSubset(base: qm.Base, subsetId: number, callback: any) {
        if (!Number.isInteger(subsetId)) {
            throw new BadRequest(`Invalid subset; subsetId=${subsetId}`);
        }
        const subset = base.store("Subsets")[subsetId] as ISubsetRecord;
        if (!subset || subset.deleted) {
            return true;
        }
        if (subset.deleted !== undefined && subset.deleted === false) {
            subset.deleted = true;
            subset.usedBy?.each((rec: qm.Record) => {
                callback(base, rec.$id, this.deleteSubset.bind(this));
            });
        }
        if (subset.resultedIn) {
            subset.resultedIn.$delJoin("produced", subset);
            if (subset.resultedIn?.produced?.empty) {
                // delete the method with all deleted producted subsets
                callback(base, subset?.resultedIn.$id, this.deleteSubset.bind(this));
            }
        }
        return true;
    }

    /**
     * Prepares a file containing the subset documents; used to download.
     * @param base - The qminer base.
     * @param subsetId - The subset ID.
     * @param fields - The document fields.
     */
    downloadSubset(base: qm.Base, subsetId: number, fields: IBaseDatasetField[]) {
        /**
         * Formats the document field value.
         * @param record - The document record.
         * @param field - The database field.
         */
        function formatDocumentField(record: IDocumentRecord, field: IBaseDatasetField) {
            if (!record[field.name]) {
                return "";
            }
            return field.group === "category"
                ? record[field.name].toArray().join("\\")
                : `${record[field.name]}`;
        }
        /**
         * Formats the date value.
         * @param date - The date.
         */
        function formatDate(date: Date) {
            function formatDigits(value: number) {
                return `0${value}`.substring(value >= 10 ? 1 : 0);
            }
            const [year, month, day] = [date.getFullYear(), date.getMonth(), date.getDay() + 1];
            return `${year}-${formatDigits(month)}-${formatDigits(day)}`;
        }

        /////////////////////////////////////////////
        // Start Processing
        /////////////////////////////////////////////

        if (!Number.isInteger(subsetId)) {
            throw new BadRequest(`Invalid subset id; subsetId=${subsetId}`);
        }
        const subset = base.store("Subsets")[subsetId] as ISubsetRecord;
        if (!subset || subset.deleted) {
            throw new BadRequest(`Invalid subset id; subsetId=${subsetId}`);
        }
        // prepare the document values
        const stringToReplaceCommas = "&&&&";
        const documents = subset.hasElements.map((doc) =>
            fields.map((field) => {
                // format the document values and replace commas
                const value = formatDocumentField(doc, field);
                return value.replace(/,/g, stringToReplaceCommas);
            })
        );
        // join the documents with an ew line in between them
        let csv = `"${documents.join('"\n"').replace(/,/g, '","')}"`;
        csv = csv.replace(new RegExp(`${stringToReplaceCommas}`, "g"), ",");
        csv = `${fields.map((field) => field.name).join(",")}\n${csv}`;

        // create the file name and write the content
        const filetime = formatDate(new Date());
        const filedocs = `${subset.hasElements.length}`;
        const filelabel = subset.label.replace(/[ (<=>&,;\\!|\/)]+/g, "");
        const filerand = Math.random().toString().slice(2);
        // create the file and write to it
        const filename = `${filetime}-${filedocs}-${filelabel}-${filerand}.csv`;
        const filepath = resolve(TMP_DOWNLOAD_PATH, filename);
        fs.writeFileSync(filepath, csv, "utf8");
        // return the filepath
        return { filepath };
    }
}
