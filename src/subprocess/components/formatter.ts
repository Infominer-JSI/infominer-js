import { EMethodType, IDocumentRecord, IMethodRecord, ISubsetRecord } from "../../interfaces";

import qm from "qminer";

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
        usedBy: rec.usedBy && !rec.usedBy.empty ? availableRecords(rec.usedBy) : null,
        nDocuments: !rec.hasElements.empty ? rec.hasElements.length : null,
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
        status: rec.status,
        appliedOn: rec.appliedOn?.$id,
        produced: rec.produced && !rec.produced.empty ? availableRecords(rec.produced) : null,
        parameters: rec.parameters,
        result: formatMethodResults(rec.type, rec.result),
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

/**
 * Returns the IDs of the available records.
 * @param recordSet - The record set containing the subsets or methods.
 */
function availableRecords(recordSet: qm.RecordSet) {
    if (!recordSet.empty && recordSet[0] && recordSet[0].deleted === undefined) {
        // legacy support; records do not have deleted attribute
        return recordSet.map((rec: qm.Record) => rec.$id) as number[];
    }
    // filter out documents that were deleted
    recordSet.filterByField("deleted", false);
    return !recordSet.empty ? (recordSet.map((rec: qm.Record) => rec.$id) as number[]) : null;
}

/**
 * Formats the method results.
 * @param type - The method type.
 * @param result - The method results.
 */
function formatMethodResults(type: string, result: any) {
    if (!result || !Object.keys(result).length) {
        // handle empty results
        return null;
    }
    switch (type) {
        case EMethodType.AGGREGATE:
            // handle aggregate results
            return result;
        case EMethodType.CLUSTERING_KMEANS:
            // handle kmeans clustering results
            return {
                clusters: result.clusters.map((cluster: any) => ({
                    subsetId: cluster.subsetId,
                    distances: cluster.distances,
                    features: cluster.features,
                })),
                ...(result.empty && {
                    empty: {
                        subsetId: result.empty.subsetId,
                    },
                }),
            };
        case EMethodType.ACTIVE_LEARNING:
            // handle active learning results
            const { labelCount, positive, negative } = result;
            return {
                labelCount: labelCount,
                positive: {
                    subsetId: positive.subsetId,
                    distances: positive.distances,
                    features: positive.features,
                },
                negative: {
                    subsetId: negative.subsetId,
                    distances: negative.distances,
                    features: negative.features,
                },
            };
        default:
            return result;
    }
}
