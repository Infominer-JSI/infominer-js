import {
    EMethodStatus,
    EMethodType,
    IBaseDatasetField,
    IAggregatesModelParams,
    IProcessing,
    ISubsetRecord,
} from "../../../interfaces";

import qm from "qminer";
import ModelBasic from "./ModelBasic";
import { aggregates } from "../utils/utils";

export default class Aggregates extends ModelBasic {
    private result: { [key: string]: any };
    private fields: IBaseDatasetField[];

    /**
     * Creates a new Aggregates instance.
     * @param base - The QMiner base.
     * @param subset - The subset.
     * @param params - The model parameters.
     * @param fields - The document fields.
     */
    constructor(
        base: qm.Base,
        subset: ISubsetRecord,
        params: IAggregatesModelParams,
        fields: IBaseDatasetField[]
    ) {
        super(base, subset, params, EMethodType.AGGREGATE);
        this.fields = fields;
        this.result = {};
    }

    /** Initializes the model. */
    init(): Aggregates {
        return this;
    }

    /** Trains the model. */
    train(): Aggregates {
        // set the method status
        this.method.status = EMethodStatus.LOADING;
        // get the aggregates of the subset
        this.result.aggregates = aggregates(
            this.subset,
            this.fields,
            this.params.processing as IProcessing
        );
        // set the method results
        this.method.result = this.result;
        this.method.status = EMethodStatus.FINISHED;
        return this;
    }
}
