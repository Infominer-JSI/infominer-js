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
        /////////////////////////////
        // BASIC COMMANDS
        /////////////////////////////

        case EParentCmd.INIT:
            initialize(message);
            break;
        case EParentCmd.SHUTDOWN:
            shutdownProcess(message);
            break;

        /////////////////////////////
        // DATASET COMMANDS
        /////////////////////////////

        case EParentCmd.CREATE_DATASET:
            createDataset(message);
            break;
        case EParentCmd.OPEN_DATASET:
            openDataset(message);
            break;
        case EParentCmd.GET_DATASET:
            getDataset(message);
            break;
        case EParentCmd.UPDATE_DATASET:
            updateDataset(message);
            break;

        /////////////////////////////
        // SUBSET COMMANDS
        /////////////////////////////

        case EParentCmd.GET_SUBSETS:
            getSubsets(message);
            break;
        case EParentCmd.GET_SUBSET:
            getSubset(message);
            break;
        case EParentCmd.UPDATE_SUBSET:
            updateSubset(message);
            break;
        case EParentCmd.DELETE_SUBSET:
            deleteSubset(message);
            break;

        /////////////////////////////
        // METHOD COMMANDS
        /////////////////////////////

        case EParentCmd.GET_METHODS:
            getMethods(message);
            break;
        case EParentCmd.GET_METHOD:
            getMethod(message);
            break;
        case EParentCmd.CREATE_METHOD:
            createMethod(message);
            break;
        case EParentCmd.DELETE_METHOD:
            deleteMethod(message);
            break;

        /////////////////////////////
        // UNKNOWN COMMAND
        /////////////////////////////

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
        initialized: true,
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
async function unknownCommand(message: IParentMsg) {
    await _functionWrapper(message, (body) => {
        throw Error(`Unknown command: ${body?.cmd}`);
    });
}

//////////////////////////////////////////////////////
// Dataset request handling
//////////////////////////////////////////////////////

// creates the dataset
async function createDataset(message: IParentMsg) {
    await _functionWrapper(message, async (body) => {
        // create the base dataset
        const { file, dataset: data } = body?.content;
        baseDataset = new BaseDataset({ fields: file.fields, ...data });
        await baseDataset.populateBase(file);
        const { dataset, subsets, methods } = baseDataset.getDataset();
        return { dataset, subsets, methods };
    });
}

// opens the dataset
async function openDataset(message: IParentMsg) {
    await _functionWrapper(message, async (body) => {
        const { file, dataset: data } = body?.content;
        baseDataset = new BaseDataset({ fields: file.fields, ...data });
        const { dataset, subsets, methods } = baseDataset.getDataset();
        return { dataset, subsets, methods };
    });
}

// gets the dataset
async function getDataset(message: IParentMsg) {
    await _functionWrapper(message, async () => {
        const { dataset, subsets, methods } = (baseDataset as BaseDataset).getDataset();
        return { dataset, subsets, methods };
    });
}

// updates the dataset
async function updateDataset(message: IParentMsg) {
    await _functionWrapper(message, async (body) => {
        const { dataset: data } = body?.content;
        const dataset = (baseDataset as BaseDataset).updateDataset(data);
        return { dataset };
    });
}

//////////////////////////////////////////////////////
// Subset request handling
//////////////////////////////////////////////////////

// gets the subsets
async function getSubsets(message: IParentMsg) {
    await _functionWrapper(message, async () => {
        const { subsets } = (baseDataset as BaseDataset).getSubsets();
        return { subsets };
    });
}

// gets the specific subset
async function getSubset(message: IParentMsg) {
    await _functionWrapper(message, async (body) => {
        const { subsetId } = body?.content;
        const { subsets, methods } = (baseDataset as BaseDataset).getSubset(subsetId);
        return { subsets, methods };
    });
}

// updates the specific subset
async function updateSubset(message: IParentMsg) {
    await _functionWrapper(message, async (body) => {
        const { subsetId, subset } = body?.content;
        const { subsets } = (baseDataset as BaseDataset).updateSubset(subsetId, subset);
        return { subsets };
    });
}

// delete the subset
async function deleteSubset(message: IParentMsg) {
    await _functionWrapper(message, async (body) => {
        const { subsetId } = body?.content;
        const isDeleted = (baseDataset as BaseDataset).deleteSubset(subsetId);
        return { subsets: { id: subsetId, isDeleted } };
    });
}

//////////////////////////////////////////////////////
// Method request handling
//////////////////////////////////////////////////////

// gets all methods
async function getMethods(message: IParentMsg) {
    await _functionWrapper(message, async () => {
        const { methods } = (baseDataset as BaseDataset).getMethods();
        return { methods };
    });
}

// creates a new method
async function createMethod(message: IParentMsg) {
    await _functionWrapper(message, async (body) => {
        const { method } = body?.content;
        const { methods, subsets } = await (baseDataset as BaseDataset).createMethod(method);
        return { methods, subsets };
    });
}

// gets a specific method
async function getMethod(message: IParentMsg) {
    await _functionWrapper(message, async (body) => {
        const { methodId } = body?.content;
        const { methods, subsets } = (baseDataset as BaseDataset).getMethod(methodId);
        return { methods, subsets };
    });
}

// delete the method
async function deleteMethod(message: IParentMsg) {
    await _functionWrapper(message, async (body) => {
        const { methodId } = body?.content;
        const isDeleted = (baseDataset as BaseDataset).deleteMethod(methodId);
        return { methods: { id: methodId, isDeleted } };
    });
}
