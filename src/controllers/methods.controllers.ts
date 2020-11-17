import { Request, Response, NextFunction } from "express";

import { requestWrapper } from "../utils/processHandlers";
import { EParentCmd } from "../interfaces";

// gets the methods
export const getMethods = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        const cmd = EParentCmd.GET_METHODS;
        return { id: null, cmd, content: null, owner: null };
    });
};

// creates a method
export const createMethod = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        const cmd = EParentCmd.CREATE_METHOD;
        return { id: null, cmd, content: null, owner: null };
    });
};

// checks the method status
export const checkMethodStatus = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        const cmd = EParentCmd.CHECK_METHOD_STATUS;
        return { id: null, cmd, content: null, owner: null };
    });
};

// gets the method
export const getMethod = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        const cmd = EParentCmd.GET_METHOD;
        return { id: null, cmd, content: null, owner: null };
    });
};

// updates the method
export const updateMethod = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        const cmd = EParentCmd.UPDATE_METHOD;
        return { id: null, cmd, content: null, owner: null };
    });
};

// deletes the method
export const deleteMethod = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        const cmd = EParentCmd.DELETE_METHOD;
        return { id: null, cmd, content: null, owner: null };
    });
};
