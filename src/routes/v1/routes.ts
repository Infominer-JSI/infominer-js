import express, { Request, Response, NextFunction } from "express";
import { param, validationResult } from "express-validator";

// import utils
import { BadRequest } from "../../utils/ErrorDefs";

// import middleware
import uploadFile from "../../middleware/fileUpload";

// import controllers
import * as ctrls from "../../controllers";

const router = express.Router();

// //////////////////////////////////////////////
// Helper functions
// //////////////////////////////////////////////

// validate the request parameters
const validateRequest = (req: Request, _res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // create the error message
        const message = errors
            .array()
            .map((val) => `${val.msg}: ${val.param}`)
            .join(", ");
        // send the bad request error
        return next(new BadRequest(message));
    }
    return next();
};

// //////////////////////////////////////////////
// Datasets Routes
// //////////////////////////////////////////////

router.get("/datasets", ctrls.getDatasets);
router.post("/datasets", uploadFile, ctrls.uploadDataset);

// check if the subroutes have the appropriate parameters
router.all(
    // specify which subroutes to check
    ["/datasets/:datasetId", "/datasets/:datasetId/*"],
    // which parameter to check
    [param("datasetId").isInt()],
    // the validation middleware
    validateRequest
);

// set the dataset parameter conversions
const datasetConversion = [param("datasetId").toInt()];
router.get("/datasets/:datasetId", datasetConversion, ctrls.getDataset);
router.post("/datasets/:datasetId", datasetConversion, ctrls.createDataset);
router.put("/datasets/:datasetId", datasetConversion, ctrls.updateDataset);
router.delete("/datasets/:datasetId", datasetConversion, ctrls.deleteDataset);
router.get("/datasets/:datasetId/status", datasetConversion, ctrls.checkDatasetStatus);

// //////////////////////////////////////////////
// Methods Routes
// //////////////////////////////////////////////

router.get("/datasets/:datasetId/methods", datasetConversion, ctrls.getMethods);
router.post("/datasets/:datasetId/methods", datasetConversion, ctrls.createMethod);

// check if the subroutes have the appropriate parameters
router.all(
    // specify which subroutes to check
    ["/datasets/:datasetId/methods/:methodId", "/datasets/:datasetId/methods/:methodId/*"],
    // which parameter to check
    [param("methodId").isInt()],
    // the validation middleware
    validateRequest
);
// set the method parameter conversions
const methodConversion = [param("datasetId").toInt(), param("methodId").toInt()];
router.get(
    "/datasets/:datasetId/methods/:methodId/status",
    methodConversion,
    ctrls.checkMethodStatus
);
router.get("/datasets/:datasetId/methods/:methodId", methodConversion, ctrls.getMethod);
router.put("/datasets/:datasetId/methods/:methodId", methodConversion, ctrls.updateMethod);
router.delete("/datasets/:datasetId/methods/:methodId", methodConversion, ctrls.deleteMethod);

// //////////////////////////////////////////////
// Subsets Routes
// //////////////////////////////////////////////

router.get("/datasets/:datasetId/subsets", datasetConversion, ctrls.getSubsets);
router.post("/datasets/:datasetId/subsets", datasetConversion, ctrls.createSubset);

// check if the subroutes have the appropriate parameters
router.all(
    // specify which subroutes to check
    ["/datasets/:datasetId/subsets/:subsetId", "/datasets/:datasetId/subsets/:subsetId/*"],
    // which parameter to check
    [param("subsetId").isInt()],
    // the validation middleware
    validateRequest
);
// set the subset parameter conversions
const subsetConversion = [param("datasetId").toInt(), param("methodId").toInt()];
router.get("/datasets/:datasetId/subsets/:subsetId", subsetConversion, ctrls.getSubset);
router.put("/datasets/:datasetId/subsets/:subsetId", subsetConversion, ctrls.updateSubset);
router.delete("/datasets/:datasetId/subsets/:subsetId", subsetConversion, ctrls.deleteSubset);

// //////////////////////////////////////////////
// Documents Routes
// //////////////////////////////////////////////

router.get(
    "/datasets/:datasetId/subsets/:subsetId/documents",
    subsetConversion,
    ctrls.getDocuments
);

// check if the subroutes have the appropriate parameters
router.all(
    // specify which subroutes to check
    [
        "/datasets/:datasetId/subsets/:subsetId/documents/:documentId",
        "/datasets/:datasetId/subsets/:subsetId/documents/:documentId/*",
    ],
    // which parameter to check
    [param("documentId").isInt()],
    // the validation middleware
    validateRequest
);
// set the documents parameter conversions
const documentsConversion = [
    param("datasetId").toInt(),
    param("methodId").toInt(),
    param("documentId").toInt(),
];
router.get(
    "/datasets/:datasetId/subsets/:subsetId/documents/:documentId",
    documentsConversion,
    ctrls.getDocument
);
router.put(
    "/datasets/:datasetId/subsets/:subsetId/documents/:documentId",
    documentsConversion,
    ctrls.updateDocument
);

export default router;
