import express from "express";

import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

// import error handling objects
import { NotFound } from "./utils/errors";

import handleErrors from "./middleware/handleErrors";

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

// add session configurations
// if (config.isProduction) {
//     app.set("trust proxy", 1);
// }

app.get("/", (req, res) => {
    res.send("hello world!");
});

// set all other routes not available
app.use("*", (_req, _res, next) => {
    return next(new NotFound("Route not found"));
});

// handle errors
app.use(handleErrors);

const port = 8000; // default port to listen

app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`server started at http://localhost:${port}`);
});
