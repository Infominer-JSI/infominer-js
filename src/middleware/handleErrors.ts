/***********************************************
 * Handle errors
 * This middleware handles errors that are
 * evoked by the service.
 */

import { Request, Response, NextFunction } from "express";

import { GeneralError } from "../utils/ErrorDefs";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleErrors = (error: Error, req: Request, res: Response, _next: NextFunction) => {
    // add error to the request
    req.error = error;
    // return the error
    if (error instanceof GeneralError) {
        return res.status(error.statusCode).json({
            status: "error",
            message: error.message,
        });
    }
    return res.status(500).json({
        status: "error",
        message: "Error on server side",
    });
};

export default handleErrors;
