import express from "express";

import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

// import error handling objects
import { RouteNotFound } from "./utils/ErrorDefs";
import handleErrors from "./middleware/handleErrors";

// //////////////////////////////////////////////
// Setup the graceful shutdowns
// //////////////////////////////////////////////

import { processControl } from "./utils/processHandlers";

// shutdown all of the child processes
async function gracefulShutdown() {
    const status = await processControl.closeProcesses();
    console.log(status);
}

// manual graceful restart
process.on("SIGINT", async () => {
    await gracefulShutdown();
    process.exit(0);
});

// nodemon graceful restart
process.on("SIGUSR2", async () => {
    await gracefulShutdown();
    process.exit(0);
});

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

import datasets from "./routes/v1/datasets";
import subsets from "./routes/v1/subsets";
import methods from "./routes/v1/methods";

app.use("/api/v1/datasets", datasets);
app.use("/api/v1/subsets", subsets);
app.use("/api/v1/methods", methods);

app.get("/", (req, res) => {
    res.send("hello world!");
});

// set all other routes not available
app.use("*", (_req, _res, next) => {
    return next(new RouteNotFound("Route not found"));
});

// handle errors
app.use(handleErrors);

const port = 8100; // default port to listen

app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`server started at http://localhost:${port}`);
});
