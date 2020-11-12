import { ChildProcess } from "child_process";

//////////////////////////////////////////////////////
// different callbacks

export type ICallbackFunc<T> = (error?: Error, data?: T) => void;

//////////////////////////////////////////////////////
// child process handling related interfaces

export interface IChildH {
    child: ChildProcess;
    connected: boolean;
    lastCall: number;
}

export interface ICallbackH {
    timestamp: number;
    retriesLeft: number;
    callback: ICallbackFunc<any>;
}

export interface IChildMsg {
    requestId: number;
    error?: string;
    results?: any;
}

export interface IParentMsg {
    cmd: string;
    [key: string]: any;
}

export interface IProcessHandlerParams {
    processPath: string;
    processMaxAge: number;
    cleanupInterval: number;
}
