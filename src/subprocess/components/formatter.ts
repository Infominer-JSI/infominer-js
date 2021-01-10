import { IDocumentRecord, IMethodRecord, ISubsetRecord } from "../../interfaces";

import qm from "qminer";

/**
 * Returns the IDs of the available records.
 * @param recordSet - The record set containing the subsets or methods.
 */
function availableRecords(recordSet: qm.RecordSet) {
    if (recordSet[0] && recordSet[0].deleted === undefined) {
        // legacy support; records do not have deleted attribute
        return recordSet.map((rec: qm.Record) => rec.$id) as number[];
    }
    // filter out documents that were deleted
    recordSet.filterByField("deleted", false);
    return recordSet.length ? (recordSet.map((rec: qm.Record) => rec.$id) as number[]) : null;
}

export default {
    /**
     * Formats the subset record.
     * @param rec - The subset record.
     */
    subset: (rec: ISubsetRecord) => ({
        id: rec.$id,
        type: "subset",
        label: rec.label,
        description: rec.description,
        resultedIn: rec.resultedIn ? rec.resultedIn.$id : null,
        usedBy: !rec.usedBy?.empty ? availableRecords(rec.usedBy as qm.RecordSet) : null,
        nDocs: !rec.hasElements.empty ? rec.hasElements.length : null,
        modified: rec.modified,
        metadata: rec.metadata,
    }),
    /**
     * Formats the method record.
     * @param rec - The method record.
     */
    method: (rec: IMethodRecord) => ({
        id: rec.$id,
        type: "method",
        method: rec.type,
        parameters: rec.parameters,
        // TODO: update the results based on the method
        results: rec.results,
        produced: !rec.produced?.empty ? availableRecords(rec.produced as qm.RecordSet) : null,
        appliedOn: rec.appliedOn?.$id,
        modified: rec.modified,
    }),

    /**
     * Formats the document record.
     * @param rec - The document record.
     */
    document: (rec: IDocumentRecord) => ({
        id: rec.$id,
        type: "document",
        subsets: !rec.inSubsets?.empty ? availableRecords(rec.inSubsets as qm.RecordSet) : null,
        values: rec.toJSON(false, false, false),
    }),
};
