/***********************************************
 * Request Parsers
 * This exports the functions used to parse
 * the requests parameters, query, body and
 * credentials.
 */

// import interfaces
import { Request } from "express";

// parses the request parameters
export function parseParams(req: Request) {
    const { datasetId, subsetId, methodId, documentId } = req.params;
    return {
        datasetId: parseInt(datasetId),
        subsetId: parseInt(subsetId),
        methodId: parseInt(methodId),
        documentId: parseInt(documentId),
    };
}

// parses the request query
export function parseQuery(req: Request) {
    return req.query;
}

// parses the request body
export function parseBody(req: Request) {
    return req.body;
}

// parses the request credentials
export function parseCredentials(req: Request) {
    return { owner: req.owner };
}
