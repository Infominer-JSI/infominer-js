/***********************************************
 * Method Controllers
 * This file contains the controller functions
 * for handling method routes.
 */

// import interface
import { Request, Response, NextFunction } from "express";
import { EParentCmd } from "../../interfaces";

// import utils
import { requestWrapper } from "../../utils/processHandlers";
import { parseParams, parseBody, parseCredentials } from "../../utils/requestParsers";

// //////////////////////////////////////////////
// Export controllers
// //////////////////////////////////////////////

// gets the methods
export const getMethods = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // parse the request
        const { owner } = parseCredentials(req);
        const { datasetId } = parseParams(req);
        // assign the command
        const cmd = EParentCmd.GET_METHODS;
        // return the values
        return { id: datasetId, owner, cmd, content: null };
    });
};

// creates a method
export const createMethod = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        // parse the request
        const { owner } = parseCredentials(req);
        const { datasetId } = parseParams(req);
        const { method } = parseBody(req);
        // assign the command
        const cmd = EParentCmd.CREATE_METHOD;
        // return the values
        return { id: datasetId, owner, cmd, content: { method } };
    });
};

// checks the method status
export const checkMethodStatus = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        // parse the request
        const { owner } = parseCredentials(req);
        const { datasetId, methodId } = parseParams(req);
        // assign the command
        const cmd = EParentCmd.CHECK_METHOD_STATUS;
        // return the values
        return { id: datasetId, owner, cmd, content: { methodId } };
    });
};

// gets the method
export const getMethod = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // parse the request
        const { owner } = parseCredentials(req);
        const { datasetId, methodId } = parseParams(req);
        // assign the command
        const cmd = EParentCmd.GET_METHOD;
        // return the values
        return { id: datasetId, owner, cmd, content: { methodId } };
    });
};

// updates the method
export const updateMethod = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        // parse the request
        const { owner } = parseCredentials(req);
        const { datasetId, methodId } = parseParams(req);
        // assign the command
        const cmd = EParentCmd.UPDATE_METHOD;
        // return the values
        return { id: datasetId, owner, cmd, content: { methodId } };
    });
};

// deletes the method
export const deleteMethod = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // parse the request
        const { owner } = parseCredentials(req);
        const { datasetId, methodId } = parseParams(req);
        // assign the command
        const cmd = EParentCmd.DELETE_METHOD;
        // return the values
        return { id: datasetId, owner, cmd, content: { methodId } };
    });
};
