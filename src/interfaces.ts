import qm from "qminer";
import { ChildProcess } from "child_process";

//////////////////////////////////////////////////////
// Callback definitions
//////////////////////////////////////////////////////

export type TSimpleCallback = (error?: Error) => void;
export type TGeneralCallback<T> = (error?: Error, data?: T) => void;
export type TRequestCallback = () => { id: number; owner: string; cmd: EParentCmd; content: any };
export type TMessageProcess = (body?: IProcessSendParams) => any | Promise<any>;

//////////////////////////////////////////////////////
// Dataset uploading status
//////////////////////////////////////////////////////

export enum EDatasetStatus {
    IN_QUEUE = "IN_QUEUE",
    LOADING = "LOADING",
    FINISHED = "FINISHED",
}

export interface IField {
    name: string;
    type: string;
    included: boolean;
    defaultShow?: boolean;
}

//////////////////////////////////////////////////////
// Child process handling related interfaces
//////////////////////////////////////////////////////

export enum EParentCmd {
    INIT = "INIT",
    SHUTDOWN = "SHUTDOWN",
    // dataset commands

    CREATE_DATASET = "CREATE_DATASET",
    OPEN_DATASET = "OPEN_DATASET",
    GET_DATASET = "GET_DATASET",
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

//////////////////////////////////////////////////////
// Base interfaces
//////////////////////////////////////////////////////

export enum EBaseMode {
    CREATE_CLEAN = "createClean",
    OPEN = "open",
}

export interface IBaseDatasetParams {
    mode: EBaseMode;
    dbpath: string;
    fields: IField[];
    metadata: {
        id: number;
        name: string;
        description: string | null;
        created: string;
    };
    preprocessing?: {
        stopwords?: {
            language?: string;
            words?: string[];
        };
    };
}

export interface IFileMetadata {
    filepath: string;
    delimiter: string;
    fields: IField[];
}

export interface IBaseDatasetField extends qm.IField {
    aggregate?: string;
}

export enum EAggregateType {
    HIERARCHY = "hierarchy",
    HISTOGRAM = "histogram",
    KEYWORDS = "keywords",
    TIMELINE = "timeline",
}

export interface IBaseDatasetUpdateParams {
    name?: string;
    description?: string;
}

//////////////////////////////////////////////////////
// Record interface
//////////////////////////////////////////////////////

export interface IDocumentRecord extends qm.Record {
    inSubsets: qm.RecordSet | null;
}

export interface ISubsetRecord extends qm.Record {
    label: string;
    description: null | string;
    metadata: null | { [key: string]: any };
    modified: boolean;
    deleted: boolean;
    hasElements: qm.RecordSet;
    resultedIn: IMethodRecord | null;
    usedBy: IMethodRecordSet | null;
}

export interface ISubsetRecordSet extends qm.RecordSet {
    each(callback: (rec: ISubsetRecord) => void): ISubsetRecordSet;
    filter(callback: (rec: ISubsetRecord) => boolean): ISubsetRecordSet;
    map(callback: (rec: ISubsetRecord) => any): any[];
    [key: number]: ISubsetRecord;
}

export interface IMethodRecord extends qm.Record {
    type: string;
    parameters: { [key: string]: any };
    result: null | { [key: string]: any };
    modified: boolean;
    deleted: boolean;
    produced: ISubsetRecordSet | null;
    appliedOn: ISubsetRecord | null;
}

export interface IMethodRecordSet extends qm.RecordSet {
    each(callback: (rec: IMethodRecord) => void): IMethodRecordSet;
    filter(callback: (rec: IMethodRecord) => boolean): IMethodRecordSet;
    map(callback: (rec: IMethodRecord) => any): any[];
    [key: number]: IMethodRecord;
}

//////////////////////////////////////////////////////
// Subset interface
//////////////////////////////////////////////////////

export interface ISubsetCreateParams {
    label: string;
    description: string;
    resultedIn?: qm.Record;
    documents?: qm.RecordSet;
}

export interface ISubsetUpdateParams {
    label?: string;
    description?: string;
}

//////////////////////////////////////////////////////
// Method interface
//////////////////////////////////////////////////////

export interface IHierarchyObject {
    name: string;
    size: number;
    children: IHierarchyObject[];
}

//////////////////////////////////////////////////////
// Formatter interface
//////////////////////////////////////////////////////

export interface ISubsetFormatter {
    id: number;
    type: string;
    label: string;
    description: string | null;
    resultedIn: number | null;
    usedBy: number[] | null;
    nDocuments: number | null;
    modified: boolean;
    metadata: { [key: string]: any } | null;
}

export interface IMethodFormatter {
    id: number;
    type: string;
    method: string;
    parameters: any;
    result: any;
    produced: number[] | null;
    appliedOn?: number;
    modified: boolean;
}

export interface IDocumentFormatter {
    id: number;
    type: string;
    subsets: number[] | null;
    values: { [key: string]: any };
}

export interface IFormatter {
    subset: (rec: ISubsetRecord) => ISubsetFormatter;
    method: (rec: IMethodRecord) => IMethodFormatter;
    document: (rec: IDocumentRecord) => IDocumentFormatter;
}
