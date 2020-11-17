import { Request, Response, NextFunction } from "express";

import { requestWrapper } from "../utils/processHandlers";
import { EParentCmd } from "../interfaces";

// gets the datasets
export const getDatasets = (req: Request, res: Response, next: NextFunction) => {
    // TODO: finalize the command
    return res.status(200).json({ message: "dataset list" });
};

// uploads the dataset
export const uploadDataset = (req: Request, res: Response, next: NextFunction) => {
    // TODO: finalize the command
    return res.status(200).json({ message: "dataset list" });
};

// creates the dataset
export const createDataset = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        const cmd = EParentCmd.CREATE_DATASET;
        return { id: null, cmd, content: null, owner: null };
    });
};

// checks the dataset status
export const checkDatasetStatus = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        const cmd = EParentCmd.CHECK_DATASET_STATUS;
        return { id: null, cmd, content: null, owner: null };
    });
};

// gets the dataset
export const getDataset = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        const cmd = EParentCmd.GET_DATASET;
        return { id: null, cmd, content: null, owner: null };
    });
};

// updates the dataset
export const updateDataset = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        const cmd = EParentCmd.UPDATE_DATASET;
        return { id: null, cmd, content: null, owner: null };
    });
};

// deletes the dataset
export const deleteDataset = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        const cmd = EParentCmd.DELETE_DATASET;
        return { id: null, cmd, content: null, owner: null };
    });
};
