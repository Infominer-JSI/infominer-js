import { Request, Response, NextFunction } from "express";

import { requestWrapper } from "../utils/processHandlers";
import { EParentCmd } from "../interfaces";

// gets the subsets
export const getSubsets = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        const cmd = EParentCmd.GET_SUBSETS;
        return { id: null, cmd, content: null, owner: null };
    });
};

// creates a new subset
export const createSubset = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        const cmd = EParentCmd.CREATE_SUBSET;
        return { id: null, cmd, content: null, owner: null };
    });
};

// gets a subset
export const getSubset = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        const cmd = EParentCmd.GET_SUBSET;
        return { id: null, cmd, content: null, owner: null };
    });
};

// updates a subset
export const updateSubset = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        const cmd = EParentCmd.UPDATE_SUBSET;
        return { id: null, cmd, content: null, owner: null };
    });
};

// deletes a subset
export const deleteSubset = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        const cmd = EParentCmd.DELETE_SUBSET;
        return { id: null, cmd, content: null, owner: null };
    });
};
