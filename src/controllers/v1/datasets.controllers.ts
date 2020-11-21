/***********************************************
 * Dataset Controllers
 * This file contains the controller functions
 * for handling dataset routes.
 */

// import interfaces
import { Request, Response, NextFunction } from "express";
import { EParentCmd } from "../../interfaces";

// import utils
import { ServerError } from "../../utils/ErrorDefs";
import { requestWrapper } from "../../utils/processHandlers";
import { parseParams, parseCredentials } from "../../utils/requestParsers";

// import models
import DatasetModel from "../../models/dataset.model";

// initialize the dataset model
const datasetModel = new DatasetModel("im_datasets");

// //////////////////////////////////////////////
// Export controllers
// //////////////////////////////////////////////

// gets the datasets
export const getDatasets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // parse the request parameters
        const { owner } = parseCredentials(req);
        // get and format the datasets
        const results = await datasetModel.getDatasets({ owner });
        const datasets = results.map((rec: any) => ({
            id: rec.id,
            name: rec.name,
            type: "dataset",
            created: rec.created,
            status: rec.status,
            group: null,
            order: null,
        }));
        return res.status(200).json({ datasets });
    } catch (error) {
        next(new ServerError(error.message));
    }
};

// uploads the dataset
export const uploadDataset = (req: Request, res: Response, next: NextFunction) => {
    // ! TODO: special case
    return res.status(200).json({ message: "Upload Dataset" });
};

// creates the dataset
export const createDataset = (req: Request, res: Response, next: NextFunction) => {
    // ! TODO: special case
    return res.status(200).json({ message: "Create Dataset" });
    // return requestWrapper(req, res, next, () => {
    //     // TODO: finalize the command
    //     // parse the request
    //     const { owner } = parseCredentials(req);
    //     const { datasetId } = parseParams(req);
    //     // assign the command
    //     const cmd = EParentCmd.CREATE_DATASET;
    //     return { id: datasetId, owner, cmd, content: null };
    // });
};

// checks the dataset status
export const checkDatasetStatus = (req: Request, res: Response, next: NextFunction) => {
    // ! TODO: special case
    return res.status(200).json({ message: "Check Dataset Status" });
    // return requestWrapper(req, res, next, () => {
    //     // TODO: finalize the command
    //     // parse the request
    //     const { owner } = parseCredentials(req);
    //     const { datasetId } = parseParams(req);
    //     // assign the command
    //     const cmd = EParentCmd.CHECK_DATASET_STATUS;
    //     // return the values
    //     return { id: datasetId, owner, cmd, content: null };
    // });
};

// gets the dataset
export const getDataset = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // parse the request
        const { owner } = parseCredentials(req);
        const { datasetId } = parseParams(req);
        // assign the command
        const cmd = EParentCmd.GET_DATASET;
        // return the values
        return { id: datasetId, owner, cmd, content: null };
    });
};

// updates the dataset
export const updateDataset = (req: Request, res: Response, next: NextFunction) => {
    return requestWrapper(req, res, next, () => {
        // TODO: finalize the command
        // parse the request
        const { owner } = parseCredentials(req);
        const { datasetId } = parseParams(req);
        // assign the command
        const cmd = EParentCmd.UPDATE_DATASET;
        // return the values
        return { id: datasetId, owner, cmd, content: null };
    });
};

// deletes the dataset
export const deleteDataset = (req: Request, res: Response, next: NextFunction) => {
    // ! TODO: special case
    return res.status(200).json({ message: "Delete Dataset" });
    // return requestWrapper(req, res, next, () => {
    //     // TODO: finalize the command
    //     // parse the request
    //     const { owner } = parseCredentials(req);
    //     const { datasetId } = parseParams(req);
    //     // assign the command
    //     const cmd = EParentCmd.DELETE_DATASET;
    //     // return the values
    //     return { id: datasetId, owner, cmd, content: null };
    // });
};
