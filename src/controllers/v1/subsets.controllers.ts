/***********************************************
 * Subset Controllers
 * This file contains the controller functions
 * for handling subset routes.
 */

// import interfaces
import { Request, Response, NextFunction } from "express";
import { EParentCmd } from "../../interfaces";

// import utils
import { generalRequestWrapper } from "../../utils/processHandlers";
import { parseParams, parseBody, parseCredentials } from "../../utils/requestParsers";

// //////////////////////////////////////////////
// Export controllers
// //////////////////////////////////////////////

// gets the subsets
export const getSubsets = (req: Request, res: Response, next: NextFunction) => {
    return generalRequestWrapper(req, res, next, () => {
        // TODO: check request structure
        // parse the request
        const { owner } = parseCredentials(req);
        const { datasetId } = parseParams(req);
        // assign the command
        const cmd = EParentCmd.GET_SUBSETS;
        // return the values
        return { id: datasetId, owner, cmd, content: null };
    });
};

// creates a new subset
export const createSubset = (req: Request, res: Response, next: NextFunction) => {
    return generalRequestWrapper(req, res, next, () => {
        // TODO: check request structure
        // parse the request
        const { owner } = parseCredentials(req);
        const { datasetId } = parseParams(req);
        const { subset } = parseBody(req);
        // assign the command
        const cmd = EParentCmd.CREATE_SUBSET;
        // return the values
        return { id: datasetId, owner, cmd, content: { subset } };
    });
};

// gets a subset
export const getSubset = (req: Request, res: Response, next: NextFunction) => {
    return generalRequestWrapper(req, res, next, () => {
        // TODO: check request structure
        // parse the request
        const { owner } = parseCredentials(req);
        const { datasetId, subsetId } = parseParams(req);
        // assign the command
        const cmd = EParentCmd.GET_SUBSET;
        // return the values
        return { id: datasetId, owner, cmd, content: { subsetId } };
    });
};

// updates a subset
export const updateSubset = (req: Request, res: Response, next: NextFunction) => {
    return generalRequestWrapper(req, res, next, () => {
        // TODO: check request structure
        // parse the request
        const { owner } = parseCredentials(req);
        const { datasetId, subsetId } = parseParams(req);
        const { subset } = parseBody(req);
        // assign the command
        const cmd = EParentCmd.UPDATE_SUBSET;
        // return the values
        return { id: datasetId, owner, cmd, content: { subsetId, subset } };
    });
};

// deletes a subset
export const deleteSubset = (req: Request, res: Response, next: NextFunction) => {
    return generalRequestWrapper(req, res, next, () => {
        // TODO: check request structure
        // parse the request
        const { owner } = parseCredentials(req);
        const { datasetId, subsetId } = parseParams(req);
        // assign the command
        const cmd = EParentCmd.DELETE_SUBSET;
        // return the values
        return { id: datasetId, owner, cmd, content: { subsetId } };
    });
};
