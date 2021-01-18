import {
    IBaseDatasetField,
    IDocumentFormatter,
    IDocumentQuery,
    IDocumentRecord,
    IField,
    IFormatter,
    IMethodFormatter,
    ISubsetRecord,
} from "../../interfaces";

import qm from "qminer";
import { getAggregates } from "./utils/utils";
import { BadRequest } from "../../utils/ErrorDefs";

export default class DocumentManager {
    private formatter: IFormatter;

    /**
     * Creates a new DocumentManager instance.
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
    createDocument(base: qm.Base, record: any, fields: IField[]) {
        // prepare and push record to dataset
        const rec = this._formatRecord(record, fields);
        const documentId = base.store("Dataset").push(rec);
        return documentId;
    }

    /**
     * Gets all documents following a criteria.
     * @param base - The qminer base.
     * @param subsetId - The subset ID in which we want to search.
     * @param query - The query used to get the documents.
     */
    getDocuments(base: qm.Base, query: IDocumentQuery, fields: IBaseDatasetField[]) {
        const { offset = 0, limit = 20, page, subsetId = 0, aggregates: aggr, processing } = query;
        // assign the query parameters
        const queryLimit = limit;
        const queryOffset = page ? (page - 1) * queryLimit : offset;
        // get the associated subset
        const subset = base.store("Subsets")[subsetId] as ISubsetRecord;
        // filter out the documents
        // TODO: improve this filtering by modifying qminer
        let count = 0;
        const documents = subset.hasElements.filter(() => {
            const condition = count >= queryOffset && count < queryOffset + queryLimit;
            count++;
            return condition;
        });
        // calculate the aggregates
        const aggregates =
            aggr && documents.length ? getAggregates(documents, fields, processing) : null;
        // return the documents
        return {
            documents: documents.map((rec) => this.formatter.document(rec)) as IDocumentFormatter[],
            aggregates,
            metadata: {
                totalHits: subset.hasElements.length,
                offset: queryOffset,
                limit: queryLimit,
            },
        };
    }

    /**
     * Get the document metadata.
     * @param base - The qminer base.
     * @param documentId - The document id.
     */
    getDocument(base: qm.Base, documentId: number) {
        /**
         * Gets all of the undeleted records.
         * @param recordSet - The methods record set.
         */
        const getDocumentSubsets = (recordSet: qm.RecordSet) => {
            if (!recordSet.empty && recordSet[0] && recordSet[0].deleted !== undefined) {
                recordSet.filterByField("deleted", false);
            }
            return recordSet;
        };
        if (!Number.isInteger(documentId)) {
            throw new BadRequest(`Invalid document id; documentId=${documentId}`);
        }
        // get the subset record
        const document = base.store("Dataset")[documentId] as IDocumentRecord;
        if (!document) {
            throw new BadRequest(`Document does not exist; documentId=${documentId}`);
        }
        // prepare the response
        const response = {
            documents: this.formatter.document(document),
            subsets: [] as IMethodFormatter[],
        };
        // get all associated subsets
        if (document.inSubsets && !document.inSubsets?.empty) {
            const inSubsets = getDocumentSubsets(document.inSubsets);
            response.subsets.push(
                ...inSubsets.map((rec) => this.formatter.subset(rec as ISubsetRecord))
            );
        }
        return response;
    }

    /**
     * Updates the document with the provided values.
     * @param base - The qminer base.
     * @param documentId - The document ID.
     * @param params - The document metadata.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateDocument(base: qm.Base, documentId: number, _params: any) {
        if (!Number.isInteger(documentId)) {
            throw new BadRequest(`Invalid document id; documentId=${documentId}`);
        }
        const document = base.store("Dataset")[documentId] as IDocumentRecord;
        if (!document || document.deleted) {
            throw new BadRequest(`Document does not exist; documentId=${documentId}`);
        }
        // ! TODO: implement document update
        // return the new document metadata
        return { documents: this.formatter.document(document) };
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
            case "number":
                return parseFloat(value);
            case "datetime":
                return new Date(value).toISOString();
            case "category":
                return value.split(/[\\/]/g);
            case "text":
            case "class":
                return value;
            default:
                throw new Error('Type is not "text", "class", "number", "datetime" or "category"');
        }
    }

    /**
     * Checks if the value is empty.
     * @param value - The value.
     */
    _isValueEmpty(value: string) {
        return value === null || value === "";
    }
}
