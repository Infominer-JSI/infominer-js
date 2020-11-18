/***********************************************
 * Document Controllers
 * This file contains the controller functions
 * for handling document routes.
 */

// import interfaces
import { Request, Response, NextFunction } from "express";
import { EParentCmd } from "../../interfaces";

// import utils
import { requestWrapper } from "../../utils/processHandlers";
import { parseParams, parseCredentials } from "../../utils/requestParsers";

// //////////////////////////////////////////////
// Export controllers
// //////////////////////////////////////////////

// gets the documents
export const getDocuments = (req: Request, res: Response, next: NextFunction) => {
    // ! TODO: special case
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        // parse the request
        const { owner } = parseCredentials(req);
        const { datasetId, subsetId } = parseParams(req);
        // assign the command
        const cmd = EParentCmd.GET_DOCUMENTS;
        // return the values
        return { id: datasetId, owner, cmd, content: { subsetId } };
    });
};

// gets a specific document
export const getDocument = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // parse the request
        const { owner } = parseCredentials(req);
        const { datasetId, subsetId, documentId } = parseParams(req);
        // assign the command
        const cmd = EParentCmd.GET_DOCUMENT;
        // return the values
        return { id: datasetId, owner, cmd, content: { subsetId, documentId } };
    });
};

// updates a specific document
export const updateDocument = (req: Request, res: Response, next: NextFunction) => {
    // ! TODO: special case
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        // parse the request
        const { owner } = parseCredentials(req);
        const { datasetId, subsetId, documentId } = parseParams(req);
        // assign the command
        const cmd = EParentCmd.UPDATE_DOCUMENT;
        // return the values
        return { id: datasetId, owner, cmd, content: { subsetId, documentId } };
    });
};
