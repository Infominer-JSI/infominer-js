/***********************************************
 * Dataset Controllers
 * This file contains the controller functions
 * for handling dataset routes.
 */

// import interfaces
import { Request, Response, NextFunction } from "express";
import { EParentCmd, EDatasetStatus } from "../../interfaces";

// import defaults
import { LABEL2ID } from "../../config/static";

// import utils
import {
    generalRequestWrapper,
    createDatasetProcess,
    deleteDatasetProcess,
} from "../../utils/processHandlers";
import { ServerError, BadRequest } from "../../utils/ErrorDefs";
import { removeFile, createDatabaseDirectoryPath } from "../../utils/FileSystem";
import { parseBody, parseParams, parseCredentials } from "../../utils/requestParsers";
import { parseDelimiter, parseColumns } from "../../utils/fileParsers";

// import models
import DatasetModel from "../../models/dataset.model";

// initialize the dataset model
const datasetModel = new DatasetModel("infominer.datasets");

// //////////////////////////////////////////////
// Export controllers
// //////////////////////////////////////////////

// gets the datasets
export const getDatasets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // get the user making the request
        const { owner } = parseCredentials(req);
        // get and format the datasets
        const results = await datasetModel.getDatasets({ owner });
        const datasets = results.map((rec: any) => ({
            id: rec.id,
            name: rec.name,
            type: "dataset",
            creation_date: rec.creation_date,
            status: rec.status,
            group: null,
            order: null,
        }));
        return res.status(200).json({ datasets });
    } catch (error) {
        return next(new ServerError(error.message));
    }
};

// uploads the dataset
export const uploadDataset = async (req: Request, res: Response, next: NextFunction) => {
    // get the user making the request
    const { owner } = parseCredentials(req);
    // get the file metadata
    const { path: filepath, originalname: filename } = req.file;
    try {
        // get the file delimiter
        const { delimiter, error: xerror } = await parseDelimiter(filepath);
        if (xerror) {
            // delete the file
            removeFile(filepath);
            return next(new BadRequest(xerror.message));
        }

        // get the column fields
        const { fields, error: yerror } = await parseColumns(filepath, delimiter as string);
        if (yerror) {
            // delete the file
            removeFile(filepath);
            return next(new BadRequest(yerror.message));
        }

        // store the file metadata into the database
        const record = await datasetModel.createDataset({
            owner,
            file: {
                filepath,
                filename,
                delimiter,
            },
        });
        // return the dataset metadata
        return res.status(200).json({
            dataset: {
                id: record[0].id,
                filename,
                delimiter,
                fields,
            },
            metadata: {
                types: Object.keys(LABEL2ID),
            },
        });
    } catch (error) {
        // delete the file
        removeFile(filepath);
        return next(new ServerError(error.message));
    }
};

// creates the dataset
export const createDataset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // get the user making the request
        const { owner } = parseCredentials(req);
        // parse request parameters and body
        const { datasetId } = parseParams(req);
        const {
            dataset: { name, description, parameters, fields },
        } = parseBody(req);

        // create the database path
        const dbpath = createDatabaseDirectoryPath(owner);

        const dataset = await datasetModel.getDatasets({ id: datasetId, owner });
        if (dataset.length === 0 || dataset[0].status !== EDatasetStatus.IN_QUEUE) {
            // return the bad request
            return next(new BadRequest("no valid datasets found"));
        }

        // update the dataset record
        const record = await datasetModel.updateDataset(
            {
                name,
                description,
                dbpath,
                status: EDatasetStatus.LOADING,
                parameters,
            },
            { id: datasetId, owner }
        );
        // return the notification to the user
        res.status(200).json({ dataset: { id: datasetId } });

        const filepath = record[0].file.filepath;
        const filename = record[0].file.filename;
        const delimiter = record[0].file.delimiter;
        // prepare the message to be sent to the process
        const message = {
            cmd: EParentCmd.CREATE_DATASET,
            content: {
                file: {
                    filepath,
                    filename,
                    delimiter,
                    fields,
                },
                dataset: {
                    mode: "createClean",
                    dbpath,
                    metadata: {
                        id: datasetId,
                        name,
                        description,
                        creation_date: record[0].creation_date,
                    },
                    preprocessing: parameters,
                },
            },
        };

        // send the message to the process
        return createDatasetProcess(datasetId, message, async (error) => {
            // remove the file
            removeFile(filepath);
            if (error) {
                // delete the dataset instance
                await datasetModel.deleteDataset({ id: datasetId, owner });
                throw error;
            } else {
                // update the dataset record
                await datasetModel.updateDataset(
                    {
                        status: EDatasetStatus.FINISHED,
                        file: {
                            filepath: null,
                            filename,
                            delimiter,
                            fields,
                        },
                    },
                    { id: datasetId, owner }
                );
            }
        });
    } catch (error) {
        return next(new ServerError(error.message));
    }
};

// checks the dataset status
export const checkDatasetStatus = async (req: Request, res: Response, next: NextFunction) => {
    // get the user making the request
    const { owner } = parseCredentials(req);
    // parse request parameters and body
    const { datasetId } = parseParams(req);
    try {
        // get the associated record
        const records = await datasetModel.getDatasets({ id: datasetId, owner });
        // validate the record
        if (records.length > 1) {
            return next(new BadRequest("more than one records found"));
        } else if (records.length === 0) {
            return next(new BadRequest("no records found"));
        }
        // return the dataset information
        return res.status(200).json({
            id: records[0].id,
            name: records[0].name,
            creation_date: records[0].creation_date,
            status: records[0].status,
        });
    } catch (error) {
        return next(new ServerError(error.message));
    }
};

// gets the dataset
export const getDataset = (req: Request, res: Response, next: NextFunction) => {
    return generalRequestWrapper(req, res, next, () => {
        // TODO: finalize the command
        // TODO: check request structure
        // get the user making the request
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
    return generalRequestWrapper(req, res, next, () => {
        // TODO: check request structure
        // get the user making the request
        const { owner } = parseCredentials(req);
        const { datasetId } = parseParams(req);
        const { dataset } = parseBody(req);
        // assign the command
        const cmd = EParentCmd.UPDATE_DATASET;
        // return the values
        return { id: datasetId, owner, cmd, content: { dataset } };
    });
};

// deletes the dataset
export const deleteDataset = async (req: Request, res: Response, next: NextFunction) => {
    // TODO: check request structure
    // get the user making the request
    const { owner } = parseCredentials(req);
    const { datasetId } = parseParams(req);
    const records = await datasetModel.getDatasets({ id: datasetId, owner });
    if (records.length === 0) {
        return next(new BadRequest("no datasets found"));
    }
    const record = records[0];
    // return the response to the user
    res.status(200).json({ dataset: { id: record.id, status: "DELETED" } });
    // execute the dataset deletion
    return deleteDatasetProcess(record);
};
