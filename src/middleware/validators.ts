/***********************************************
 * Request Validators
 * This middlewares validates and converts the
 * request parameters to the appropriate type.
 */

// import utils
import { param } from "express-validator";

// //////////////////////////////////////////////
// EXPORT VALIDATORS
// //////////////////////////////////////////////

export const datasets = [param("datasetId").toInt()];
export const methods = [param("datasetId").toInt(), param("methodId").toInt()];
export const subsets = [param("datasetId").toInt(), param("subsetId").toInt()];
export const documents = [
    param("datasetId").toInt(),
    param("subsetId").toInt(),
    param("documentId").toInt(),
];
