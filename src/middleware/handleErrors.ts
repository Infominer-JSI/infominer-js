import { Request, Response, NextFunction } from "express";

import { GeneralError } from "../utils/ErrorDefs";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleErrors = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof GeneralError) {
        return res.status(err.statusCode).json({
            status: "error",
            message: err.message,
        });
    }
    return res.status(500).json({
        status: "error",
        message: err.message,
    });
};

export default handleErrors;
