/***********************************************
 * Logger
 * This middleware creates the logger that is
 * used to log values.
 */

// import modules
import path from "path";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import morgan from "morgan";

// import utils
import { createDirectoryPath } from "../utils/FileSystem";

// import configurations
import config from "../config/config";

// import interfaces
import { Request } from "express";

// //////////////////////////////////////////////
// Configure logging logic
// //////////////////////////////////////////////

// create the temporary folder
const LOGS_PATH = path.join(__dirname, "..", "..", "logs");
createDirectoryPath(LOGS_PATH);

// create a daily rotation transport
const createDailyTransport = (filename: string, dirname: string, level: string) => {
    // create new daily rotation transport
    return new DailyRotateFile({
        filename: `${filename}-%DATE%.log`,
        datePattern: "YYYY-MM-DD",
        dirname,
        level,
    });
};

// creates a new winston logger
const winstonLogger = winston.createLogger({
    level: "info",
    exitOnError: false,
    transports: [
        createDailyTransport("info", LOGS_PATH, "info"),
        createDailyTransport("error", LOGS_PATH, "error"),
        ...(config.env !== "production"
            ? [
                  new winston.transports.Console({
                      level: "info",
                      format: winston.format.combine(
                          winston.format.colorize(),
                          winston.format.simple()
                      ),
                  }),
              ]
            : []),
    ],
});

// add error message to morgan
morgan.token("error", (req: Request) => {
    return req.error?.message;
});

// based on the message status writes the log
function write(msg: string) {
    // remove the newline from the message
    const xmsg = msg.replace(/\n/g, "");
    // get the message status
    const status = parseInt(xmsg.split(" ")[3], 10);
    // log based on the message status
    status < 400 ? winstonLogger.info(xmsg) : winstonLogger.error(xmsg);
}

// configure morgan formats
const morganLogger = morgan("[:date[iso]] :method :url :status :total-time[0]ms ':error'", {
    stream: { write },
});

// export the logger
export default morganLogger;
