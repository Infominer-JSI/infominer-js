import { ChildProcess } from "child_process";

//////////////////////////////////////////////////////
// Callback definitions
//////////////////////////////////////////////////////

export type TSimpleCallback = (error?: Error) => void;
export type TGeneralCallback<T> = (error?: Error, data?: T) => void;
export type TRequestCallback = () => { id: number; owner: string; cmd: EParentCmd; content: any };
export type TMessageProcess = (body?: IProcessSendParams) => any | Promise<any>;

//////////////////////////////////////////////////////
// Child process handling related interfaces
//////////////////////////////////////////////////////

export enum EParentCmd {
    INIT = "INIT",
    SHUTDOWN = "SHUTDOWN",
    // dataset commands
    GET_DATASET = "GET_DATASET",
    CREATE_DATASET = "CREATE_DATASET",
    UPDATE_DATASET = "UPDATE_DATASET",
    DELETE_DATASET = "DELETE_DATASET",
    CHECK_DATASET_STATUS = "CHECK_DATASET_STATUS",
    // method commands
    GET_METHODS = "GET_METHODS",
    CREATE_METHOD = "CREATE_METHOD",
    CHECK_METHOD_STATUS = "CHECK_METHOD_STATUS",
    GET_METHOD = "GET_METHOD",
    UPDATE_METHOD = "UPDATE_METHOD",
    DELETE_METHOD = "DELETE_METHOD",
    // subset commands
    GET_SUBSETS = "GET_SUBSETS",
    CREATE_SUBSET = "CREATE_SUBSET",
    GET_SUBSET = "GET_SUBSET",
    UPDATE_SUBSET = "UPDATE_SUBSET",
    DELETE_SUBSET = "DELETE_SUBSET",
    // document commands
    GET_DOCUMENTS = "GET_DOCUMENTS",
    GET_DOCUMENT = "GET_DOCUMENT",
    UPDATE_DOCUMENT = "UPDATE_DOCUMENT",
    // special cases
    SIGINT = "SIGINT",
    SIGTERM = "SIGTERM",
}

export interface IChildH {
    child: ChildProcess;
    connected: boolean;
    lastCall: number;
}

export interface ICallbackH {
    timestamp: number;
    retriesLeft: number;
    callback: TGeneralCallback<any>;
}

export interface IProcessSendParams {
    cmd: EParentCmd;
    [key: string]: any;
}

export interface IParentMsg {
    requestId: number;
    body: IProcessSendParams;
}

export interface IChildMsg {
    requestId: number;
    error?: string;
    results?: any;
}

export interface IProcessControlParams {
    processPath: string;
    processMaxAge: number;
    cleanupInterval: number;
}
