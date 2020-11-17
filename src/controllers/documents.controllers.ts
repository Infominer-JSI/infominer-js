import { Request, Response, NextFunction } from "express";

import { requestWrapper } from "../utils/processHandlers";
import { EParentCmd } from "../interfaces";

// gets the documents
export const getDocuments = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        const cmd = EParentCmd.GET_DOCUMENTS;
        return { id: null, cmd, content: null, owner: null };
    });
};

// gets a specific document
export const getDocument = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        const cmd = EParentCmd.GET_DOCUMENT;
        return { id: null, cmd, content: null, owner: null };
    });
};

// updates a specific document
export const updateDocument = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        const cmd = EParentCmd.UPDATE_DOCUMENT;
        return { id: null, cmd, content: null, owner: null };
    });
};
