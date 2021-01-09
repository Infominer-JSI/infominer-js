import qm from "qminer";

function availableRecords(rec: qm.Record, field: string) {
    const recordSet: qm.RecordSet = rec[field];
    if (recordSet[0].deleted === undefined) {
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
    subset: (rec: qm.Record) => ({
        id: rec.$id,
        type: "subset",
        label: rec.label as string,
        description: rec.description as string | null,
        resultedIn: rec.resultedIn ? (rec.resultedIn.$id as number) : null,
        usedBy: !rec.usedBy.empty ? availableRecords(rec, "usedBy") : null,
        nDocs: !rec.hasElements.empty ? (rec.hasElements.length as number) : null,
        modified: rec.modified as boolean,
        metadata: rec.metadata as { [key: string]: any } | null,
    }),

    method: (rec: qm.Record) => ({
        id: rec.$id,
        type: "method",
        method: rec.type as string,
        parameters: rec.parameters as any,
        // TODO: update the results based on the method
        results: rec.results as any,
        produced: !rec.produced.empty ? availableRecords(rec, "produced") : null,
        appliedOn: !rec.appliedOn.empty ? availableRecords(rec, "appliedOn") : null,
        modified: rec.modified as boolean,
    }),

    /**
     * Formats the document record.
     * @param rec - The document record.
     */
    document: (rec: qm.Record) => ({
        id: rec.$id,
        type: "document",
        subsets: !rec.inSubsets.empty ? availableRecords(rec, "inSubsets") : null,
        values: rec.toJSON(false, false, false),
    }),
};
