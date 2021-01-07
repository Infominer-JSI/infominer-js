// import server modules
import express from "express";
import favicon from "serve-favicon";
import passport from "passport";

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
// Get process parameters
// //////////////////////////////////////////////

import minimist from "minimist";
// get process arguments
const argv = minimist(process.argv.slice(2));
const PORT = argv.PORT || 8100;
const DEV_MODE = argv.DEV_MODE;

// //////////////////////////////////////////////
// Configure the express app
// //////////////////////////////////////////////

// inititalize the express app
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

// //////////////////////////////////////////////
// Add public folder
// //////////////////////////////////////////////

// add the favicon
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

// //////////////////////////////////////////////
// Set authentication
// //////////////////////////////////////////////

// passport configuration
import configuration from "./middleware/auth/configuration";
configuration(passport);
// initialize authentication
app.use(passport.initialize());
app.use(passport.session());

// set authentication routes
import authentication from "./middleware/auth/authentication";
authentication(app, passport, DEV_MODE);

// //////////////////////////////////////////////
// Add the routes
// //////////////////////////////////////////////

// import routes
import routes from "./routes/v1/routes";
app.use("/api/v1/", routes);

// set all other routes not available
app.use("*", (req, _res, next) => {
    return next(new RouteNotFound(`Route Not Found`));
});

// handle errors
app.use(handleErrors);

// //////////////////////////////////////////////
// Start the service
// //////////////////////////////////////////////

app.listen(PORT, () => {
    // tslint:disable-next-line:no-console
    console.log(`server started at http://localhost:${PORT}`);
});

// export the server for testing
export default app;
