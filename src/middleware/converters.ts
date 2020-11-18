/***********************************************
 * Request Converters
 * This middlewares convert the request
 * parameters to the appropriate type.
 */

// import utils
import { param } from "express-validator";

// //////////////////////////////////////////////
// Export converters
// //////////////////////////////////////////////

export const datasets = [param("datasetId").toInt()];
export const methods = [param("datasetId").toInt(), param("methodId").toInt()];
export const subsets = [param("datasetId").toInt(), param("subsetId").toInt()];
export const documents = [
    param("datasetId").toInt(),
    param("subsetId").toInt(),
    param("documentId").toInt(),
];
