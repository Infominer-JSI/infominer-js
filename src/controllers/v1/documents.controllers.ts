/***********************************************
 * Document Controllers
 * This file contains the controller functions
 * for handling document routes.
 */

// import interfaces
import { Request, Response, NextFunction } from "express";
import { EParentCmd } from "../../interfaces";

// import utils
import { generalRequestWrapper } from "../../utils/processHandlers";
import { parseParams, parseCredentials, parseBody } from "../../utils/requestParsers";

// //////////////////////////////////////////////
// Export controllers
// //////////////////////////////////////////////

// gets the documents
export const getDocuments = (req: Request, res: Response, next: NextFunction) => {
    return generalRequestWrapper(req, res, next, () => {
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
    return generalRequestWrapper(req, res, next, () => {
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
    return generalRequestWrapper(req, res, next, () => {
        // TODO: finalize the command
        // parse the request
        const { owner } = parseCredentials(req);
        const { datasetId, subsetId, documentId } = parseParams(req);
        const { document } = parseBody(req);
        // assign the command
        const cmd = EParentCmd.UPDATE_DOCUMENT;
        // return the values
        return { id: datasetId, owner, cmd, content: { subsetId, documentId, document } };
    });
};
