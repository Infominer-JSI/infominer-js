// //////////////////////////////////////////////
// Process Handlers
// This initializes the ProcessControl instance
// and defines all function that will help with
// sending messages to the child processes.
// //////////////////////////////////////////////

// //////////////////////////////////////////////
// Import Interfaces
// //////////////////////////////////////////////

import { TCallbackFunction, EParentCmd, IProcessSendParams } from "../interfaces";
import { Request, Response, NextFunction } from "express";

// //////////////////////////////////////////////
// Import Classes and Functions
// //////////////////////////////////////////////

import path from "path";
import ProcessControl from "./ProcessControl";
import DatasetModel from "../models/dataset.model";
import { ServerError } from "./ErrorDefs";

// //////////////////////////////////////////////
// Initialize Instances
// //////////////////////////////////////////////

// initialize the model object
const model = new DatasetModel("infominer_datasets");

// initialize the process control
const processControl = new ProcessControl({
    processPath: path.join(__dirname, "../child_process/analytics.ts"),
    cleanupInterval: 30 * 60 * 1000, // 30 minutes
    processMaxAge: 2 * 60 * 60 * 1000, // 2 hours
});

// //////////////////////////////////////////////
// Define Process Helper Functions
// //////////////////////////////////////////////

// send a message to the child process
const _initProcess = async (childId: number, owner: string, callback: TCallbackFunction<any>) => {
    try {
        const datasets = await model.getDatasets({ id: childId, owner });
        if (datasets.length !== 1) {
            throw new Error(`Multiple or none results found: ${datasets.length}`);
        }
        // get the dataset parameters
        const [
            {
                label,
                description,
                created,
                dbpath: dbPath,
                parameters: { fields, stopwords },
            },
        ] = datasets;

        const params = {
            cmd: EParentCmd.OPEN_DATASET,
            message: {
                datasetId: childId,
                label,
                description,
                created,
                mode: "open",
                dbPath,
                fields,
                parameters: {
                    stopwords,
                },
            },
        };
        // initialize the child process
        processControl.createChild(childId);
        // send the message to the child process
        processControl.sendAndWait(childId, params, callback);
    } catch (error) {
        callback(error);
    }
};

// send the message to the child process and on response
// handles it with the given callback function
const sendToProcess = (
    childId: number,
    owner: string,
    message: IProcessSendParams,
    callback: TCallbackFunction<any>
) => {
    // the intermediate function used to send messages
    const sendMessage = (error?: Error) => {
        return error ? callback(error) : processControl.sendAndWait(childId, message, callback);
    };

    if (processControl.doesChildExist(childId)) {
        // send the request to the child
        sendMessage();
    } else {
        _initProcess(childId, owner, sendMessage).catch(console.log);
    }
};

// general function to handle the child response
const generalUserResponse = (_req: Request, res: Response, next: NextFunction) => (
    error?: Error,
    results?: any
) => (error ? next(new ServerError(error.message)) : res.status(200).json(results));

export { processControl, sendToProcess, generalUserResponse };
