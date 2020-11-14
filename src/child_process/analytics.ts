console.log("Start child process, id=", process.pid);

import { EParentCmd, IChildMsg, IParentMsg, TMessageProcess } from "../interfaces";

import * as qm from "qminer";

//////////////////////////////////////////////////////
// Set infinite interval and parameters

// eslint-disable-next-line @typescript-eslint/no-empty-function
const interval = setInterval(() => {}, 10 * 1000);

// database placeholder
const database: qm.Base | null = null;

//////////////////////////////////////////////////////
// Set parent-child communcation

process.on("message", (message: IParentMsg) => {
    console.log(`Received message from parent, child process id = ${process.pid}`);
    messageHandler(message);
});

process.on("SIGINT", () => {
    console.log(`Received SIGINT, child process id = ${process.pid}`);
    shutdownProcess({ requestId: -1, body: { cmd: EParentCmd.SIGINT } });
});

process.on("SIGTERM", () => {
    console.log(`Received SIGTERM, child process id = ${process.pid}`);
    shutdownProcess({ requestId: -2, body: { cmd: EParentCmd.SIGTERM } });
});

//////////////////////////////////////////////////////
// Set infinite interval and parameters

// workaround for process.send (process.send exists only in child processes)
const processSend = (message: IChildMsg) => (process.send ? process.send(message) : null);

// correctly handles the sent message
function messageHandler(message: IParentMsg) {
    if (!message.body.cmd) {
        const { requestId } = message;
        processSend({ requestId, error: "Undefined message command" });
    }

    switch (message.body.cmd) {
        case EParentCmd.INIT:
            break;
        case EParentCmd.OPEN_DATASET:
            openDataset(message);
            break;
        case EParentCmd.SHUTDOWN:
            shutdownProcess(message);
            break;
        default:
            break;
    }
}

//////////////////////////////////////////////////////
// Define helper functions

// the message processing function wrapper
// the callback is the function that handles with the messages body and returns
// its input as the results
function _functionWrapper(message: IParentMsg, callback: TMessageProcess) {
    const { requestId, body } = message;
    try {
        // do something with the body and return the output
        const results = callback(body);
        processSend({ requestId, results });
    } catch (error) {
        // send the error message back to the parent
        processSend({ requestId, error: error.message });
    }
}

// open the dataset
function openDataset(message: IParentMsg) {
    _functionWrapper(message, () => ({
        message: "Dataset is not open",
    }));
}

// shutdown the child process
function shutdownProcess(message: IParentMsg) {
    _functionWrapper(message, () => {
        // get the databse path and close the database
        const dbPath = database ? database.close() : null; // replace with this database.getDbPath()
        if (database) {
            database.close();
        }
        return dbPath;
    });
    // clear the interval and exit the child process
    clearInterval(interval);
    process.exit(0);
}
