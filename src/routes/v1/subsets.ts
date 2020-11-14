import express from "express";

import DatasetModel from "../../models/dataset.model";

const model = new DatasetModel("infominer_datasets");

const router = express.Router();

router.get("/", async (_req, res) => {
    const results = await model.getDatasets({});
    res.status(200).json({ message: "This is the subsets route", datasets: results });
});

export default router;
