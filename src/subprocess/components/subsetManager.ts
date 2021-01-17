import {
    IFormatter,
    IMethodFormatter,
    IMethodRecord,
    ISubsetCreateParams,
    ISubsetFormatter,
    ISubsetRecord,
    ISubsetUpdateParams,
} from "../../interfaces";

import qm from "qminer";
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
}
