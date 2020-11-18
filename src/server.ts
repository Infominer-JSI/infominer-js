import express from "express";

import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

// import error handling objects
import { RouteNotFound } from "./utils/ErrorDefs";
import handleErrors from "./middleware/handleErrors";

// //////////////////////////////////////////////
// Setup the graceful shutdown
// //////////////////////////////////////////////

import { processControl } from "./utils/processHandlers";

// shutdown all of the child processes
async function gracefulShutdown() {
    if (process.platform === "win32") {
        const status = await processControl.closeProcesses();
        console.log("Graceful Shutdown", status);
    }
    // close the process
    process.exit(0);
}

// manual graceful restart
process.on("SIGINT", gracefulShutdown);

// nodemon graceful restart
process.on("SIGUSR1", gracefulShutdown);
process.on("SIGUSR2", gracefulShutdown);

// catches uncaught exceptions
process.on("uncaughtException", gracefulShutdown);

// //////////////////////////////////////////////
// Configure the express app
// //////////////////////////////////////////////

const app = express();

app.use(bodyParser.json({ limit: "10mb" })); // to support JSON-encoded bodies
app.use(
    bodyParser.urlencoded({
        // to support URL-encoded bodies
        extended: true,
        limit: "10mb",
    })
);

app.use(cookieParser(""));

app.use((req, res, next) => {
    req.owner = "development";
    next();
});

import routes from "./routes/v1/routes";
import { Server } from "http";
app.use("/api/v1/", routes);

// set all other routes not available
app.use("*", (req, _res, next) => {
    return next(new RouteNotFound(`Route not found: ${req.originalUrl}`));
});

// handle errors
app.use(handleErrors);

const port = 8100; // default port to listen

app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`server started at http://localhost:${port}`);
});

// export the server for testing
export default Server;
