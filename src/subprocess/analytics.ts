console.log("Start child process, id=", process.pid);

// import interfaces
import { EParentCmd, IChildMsg, IParentMsg, TMessageProcess } from "../interfaces";

// import modules
import BaseDataset from "./components/baseDataset";

// data placeholder
let baseDataset: BaseDataset | null = null;
//////////////////////////////////////////////////////
// Set infinite interval and parameters

// eslint-disable-next-line @typescript-eslint/no-empty-function
const interval = setInterval(() => {}, 10 * 1000);

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
    switch (message.body.cmd) {
        case EParentCmd.INIT:
            initialize(message);
            break;
        case EParentCmd.SHUTDOWN:
            shutdownProcess(message);
            break;
        case EParentCmd.CREATE_DATASET:
            createDataset(message);
            break;
        default:
            unknownCommand(message);
            break;
    }
}

//////////////////////////////////////////////////////
// Helper functions
//////////////////////////////////////////////////////

// the message processing function wrapper
// the callback is the function that handles with the messages body and returns
// its input as the results
async function _functionWrapper(message: IParentMsg, callback: TMessageProcess) {
    const { requestId, body } = message;
    try {
        // do something with the body and return the output
        const results = await callback(body);
        return processSend({ requestId, results });
    } catch (error) {
        // send the error message back to the parent
        return processSend({ requestId, error: error.message });
    }
}

//////////////////////////////////////////////////////
// Basic request handling
//////////////////////////////////////////////////////

// initialize the process
async function initialize(message: IParentMsg) {
    await _functionWrapper(message, () => ({
        message: "Process initialized",
    }));
}

// shutdown the child process
async function shutdownProcess(message: IParentMsg) {
    await _functionWrapper(message, () => {
        // get the databse path and close the database
        baseDataset?.close();
        return {};
    });
    // clear the interval and exit the child process
    clearInterval(interval);
    console.log(`Child process id = ${process.pid} shutdown`);
    process.exit(0);
}

// handle unknown commands
function unknownCommand(message: IParentMsg) {
    const { requestId, body } = message;
    // send the error message back to the parent
    processSend({ requestId, error: `unknown command: ${body.cmd}` });
}

//////////////////////////////////////////////////////
// Dataset request handling
//////////////////////////////////////////////////////

// creates the dataset
async function createDataset(message: IParentMsg) {
    await _functionWrapper(message, async (body) => {
        // create the base dataset
        const { file, dataset } = body?.content;
        baseDataset = new BaseDataset({ fields: file.fields, ...dataset });
        await baseDataset.populateBase(file);
        // TODO: aggreate the subset
        return { message: "Dataset created", dataset: baseDataset.metadata };
    });
}
