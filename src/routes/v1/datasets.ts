import express from "express";

import * as controllers from "../../controllers";

const router = express.Router();

router.get("/", async (_req, res) => {
    res.status(200).json({ message: "This is the datasets route" });
});

router.get("/:dataset_id", controllers.openDataset);

export default router;
