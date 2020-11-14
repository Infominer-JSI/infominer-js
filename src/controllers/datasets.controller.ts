import { Request, Response, NextFunction } from "express";

import { sendToProcess, generalUserResponse } from "../utils/processHandlers";
import { EParentCmd } from "../interfaces";

// opens the dataset
export const openDataset = (req: Request, res: Response, next: NextFunction) => {
    // create the message
    const message = { cmd: EParentCmd.SHUTDOWN };
    // send the message to the child process
    sendToProcess(2, "development", message, generalUserResponse(req, res, next));
};
