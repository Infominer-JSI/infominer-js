/***********************************************
 * Request Validators
 * This middlewares validates and converts the
 * request parameters to the appropriate type.
 */

// import utils
import { param, query } from "express-validator";

// //////////////////////////////////////////////
// EXPORT VALIDATORS
// //////////////////////////////////////////////

export const datasets = [param("datasetId").toInt()];
export const methods = [param("datasetId").toInt(), param("methodId").toInt()];
export const subsets = [param("datasetId").toInt(), param("subsetId").toInt()];
export const documents = [param("datasetId").toInt(), param("documentId").toInt()];
export const documentsQuery = [
    query("limit").optional().toInt(),
    query("offset").optional().toInt(),
    query("page").optional().toInt(),
    query("subsetId").optional().toInt(),
    query("aggregates").optional().toBoolean(),
];
