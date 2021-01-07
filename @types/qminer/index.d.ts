declare module "qminer" {
    export enum BaseModes {
        "createClean",
        "open",
    }
    export interface BaseParams {
        mode: BaseModes;
        dbPath: string;
        schema?: any;
    }

    export class Base {
        constructor(params: BaseParams);
        close();
    }

    export class RecordSet {}

    export class Record {}
}
