import { ChildProcess } from "child_process";

//////////////////////////////////////////////////////
// different callbacks

export type TSimpleCallback = (error?: Error) => void;
export type TCallbackFunction<T> = (error?: Error, data?: T) => void;

export type TMessageProcess = (body?: IProcessSendParams) => any;

//////////////////////////////////////////////////////
// child process handling related interfaces

export enum EParentCmd {
    INIT = "init",
    SHUTDOWN = "shutdown",
    OPEN_DATASET = "open_dataset",
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
    callback: TCallbackFunction<any>;
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
