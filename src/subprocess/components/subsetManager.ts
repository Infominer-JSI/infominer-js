import qm from "qminer";

import { IFormatter, ISubsetCreateParams } from "../../interfaces";

export default class SubsetManager {
    private formatter: IFormatter;

    constructor(formatter: IFormatter) {
        this.formatter = formatter;
    }

    /**
     * Creates a new subset.
     * @param base - The base containing the subset records.
     * @param subset - The subset metadata object.
     */
    createSubset(base: qm.Base, subset: ISubsetCreateParams) {
        // get the subset attributes
        const { label, description, resultedIn, documents } = subset;
        // create a new subset record
        const subsetId = base.store("Subsets").push({ label, description });
        if (resultedIn && !resultedIn.deleted) {
            // join the method with the subset
            base.store("Subsets")[subsetId]?.$addJoin("resultedIn", resultedIn);
        }
        if (documents) {
            // join the documents with the subset
            documents.each((doc) => {
                base.store("Subsets")[subsetId]?.$addJoin("hasElements", doc);
            });
        }
        // return the subset metadata
        return subsetId;
    }
}
