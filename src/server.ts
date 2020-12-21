// import server modules
import express from "express";
import favicon from "serve-favicon";

import path from "path";
// import parsing modules
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

// import error handling objects
import { RouteNotFound } from "./utils/ErrorDefs";
import handleErrors from "./middleware/handleErrors";

// import logging modules
import morganLogger from "./middleware/logger";

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

// add request logging
app.use(morganLogger);

// add request parsers
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

// add a public folder
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

// //////////////////////////////////////////////
// Add the routes
// //////////////////////////////////////////////

// import routes
import routes from "./routes/v1/routes";
app.use("/api/v1/", routes);

// set all other routes not available
app.use("*", (req, _res, next) => {
    return next(new RouteNotFound(`Route not found: ${req.originalUrl}`));
});

// handle errors
app.use(handleErrors);

// //////////////////////////////////////////////
// Start the service
// //////////////////////////////////////////////

const port = 8100; // default port to listen

app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`server started at http://localhost:${port}`);
});

// export the server for testing
export default app;
