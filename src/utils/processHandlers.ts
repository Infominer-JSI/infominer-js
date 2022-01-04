/***********************************************
 * Process Handlers
 * This initializes the ProcessControl instance
 * and defines all function that will help with
 * sending messages to the child processes.
 */

// Import interfaces
import {
    TGeneralCallback,
    TRequestCallback,
    EParentCmd,
    IProcessSendParams,
    EBaseMode,
} from "../interfaces";
import { Request, Response, NextFunction } from "express";

// Import modules
import path from "path";

// import utils
import ProcessControl from "./ProcessControl";
import { BadRequest, ServerError } from "./ErrorDefs";

// import models
import DatasetModel from "../models/dataset.model";
import { removeFile, removeFolder } from "./FileSystem";

// //////////////////////////////////////////////
// Initialize instances
// //////////////////////////////////////////////

// initialize the model object
const datasetModel = new DatasetModel("infominer.datasets");

// initialize the process control
const processControl = new ProcessControl({
    processPath: path.join(__dirname, "../subprocess/analytics"),
    cleanupInterval: 30 * 60 * 1000, // 30 minutes
    processMaxAge: 2 * 60 * 60 * 1000, // 2 hours
});

// //////////////////////////////////////////////
// Define process helper functions
// //////////////////////////////////////////////

// send a message to the child process
const _initProcess = async (datasetId: number, owner: string, callback: TGeneralCallback<any>) => {
    try {
        // TODO: get the dataset metadata used to open it
        const records = await datasetModel.getDatasets({ id: datasetId, owner });
        if (records.length > 1) {
            throw new ServerError(`More than one record found; datasetId=${datasetId}`);
        } else if (records.length === 0) {
            throw new BadRequest(`No records found; datasetId=${datasetId}`);
        }

        // get the dataset parameters
        const [{ name, description, created, dbpath, parameters, file }] = records;

        const params = {
            cmd: EParentCmd.OPEN_DATASET,
            content: {
                file,
                dataset: {
                    mode: EBaseMode.OPEN,
                    dbpath,
                    metadata: {
                        id: datasetId,
                        name,
                        description,
                        created,
                    },
                    processing: parameters,
                },
            },
        };
        // initialize the child process
        processControl.createChild(datasetId);
        // send the message to the child process
        processControl.sendAndWait(datasetId, params, callback);
    } catch (error: any) {
        callback(error);
    }
};

// send the message to the child process and on response
// handles it with the given callback function
const sendToProcess = (
    datasetId: number,
    owner: string,
    message: IProcessSendParams,
    callback: TGeneralCallback<any>
) => {
    // the intermediate function used to send messages
    const sendMessage = (error?: Error) => {
        return error ? callback(error) : processControl.sendAndWait(datasetId, message, callback);
    };

    if (processControl.doesChildExist(datasetId)) {
        sendMessage();
    } else {
        _initProcess(datasetId, owner, sendMessage).catch(console.log);
    }
};

// general function to handle the child response
const generalUserResponse =
    (_req: Request, res: Response, next: NextFunction) => (error?: Error, results?: any) =>
        error ? next(error) : res.status(200).json(results);

// specific function to handle the child filedownload
const downloadUserResponse =
    (_req: Request, res: Response, next: NextFunction) => (error?: Error, results?: any) =>
        error
            ? next(error)
            : res.status(200).download(results.filepath, () => {
                  removeFile(results.filepath);
              });

// creates a general request wrapper
async function generalRequestWrapper(
    req: Request,
    res: Response,
    next: NextFunction,
    callback: TRequestCallback
) {
    const { id, owner, cmd, content } = await callback();
    const message = { cmd, content };
    sendToProcess(id, owner, message, generalUserResponse(req, res, next));
}

// creates a general request wrapper
async function downloadRequestWrapper(
    req: Request,
    res: Response,
    next: NextFunction,
    callback: TRequestCallback
) {
    const { id, owner, cmd, content } = await callback();
    const message = { cmd, content };
    sendToProcess(id, owner, message, downloadUserResponse(req, res, next));
}

// create the dataset process
function createDatasetProcess(
    datasetId: number,
    message: IProcessSendParams,
    callback: TGeneralCallback<any>
) {
    processControl.createChild(datasetId);
    processControl.sendAndWait(datasetId, { cmd: EParentCmd.INIT }, (error) => {
        if (error) {
            console.log(error);
            return callback(error);
        }
        processControl.sendAndWait(datasetId, message, callback);
    });
}

// delete the dataset process
async function deleteDatasetProcess(record: any) {
    // get information required to delete the dataset
    const {
        id,
        dbpath,
        file: { filepath },
    } = record;

    await datasetModel.deleteDataset({ id });
    if (processControl.doesChildExist(id)) {
        processControl.sendAndWait(id, { cmd: EParentCmd.SHUTDOWN }, () => {
            removeFolder(dbpath);
        });
    } else {
        removeFolder(dbpath);
        removeFile(filepath);
    }
}

export {
    processControl,
    generalRequestWrapper,
    downloadRequestWrapper,
    createDatasetProcess,
    deleteDatasetProcess,
};
