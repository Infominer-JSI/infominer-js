import {
    EAggregateType,
    IBaseDatasetField,
    IDocumentRecord,
    IFormatter,
    IHierarchyObject as IHierarchyChildObject,
    ISubsetRecord,
} from "../../interfaces";

import qm from "qminer";
export default class ModelManager {
    private formatter: IFormatter;

    constructor(formatter: IFormatter) {
        this.formatter = formatter;
    }

    aggregate(base: qm.Base, subsetId: number, fields: IBaseDatasetField[]) {
        const subset = base.store("Subsets")[subsetId] as ISubsetRecord;
        // calculates the aggregates
        const aggregates = fields
            .map((field) =>
                field.aggregate
                    ? {
                          field: field.name,
                          type: field.aggregate,
                          statistics: this._statisticsByField(base, subset, field),
                      }
                    : null
            )
            .filter((v) => v);
        // prepare the method metadata
        const method = {
            type: "aggregate.subset",
            parameters: { subsetId },
            result: { aggregates },
        };
        // join the created method with the subset
        const methodId = base.store("Methods").push(method);
        base.store("Methods")[methodId]?.$addJoin("appliedOn", subset.$id);
        // return the method stored in the base
        return {};
    }

    /**
     * Calculates the subset field statistics.
     * @param base - The QMiner base.
     * @param subset - The subset record.
     * @param field - The field metadata.
     */
    _statisticsByField(base: qm.Base, subset: ISubsetRecord, field: IBaseDatasetField) {
        // get the field metadata
        const { name: fieldName, aggregate } = field;
        // calculate the distributions
        const statistics: { [key: string]: any } = {};
        if (aggregate === EAggregateType.HIERARCHY) {
            // get the hierarchy statistics
            statistics.hierarchy = [];
            subset.hasElements.each((rec: IDocumentRecord) => {
                const fieldVals: string[] | null = rec[fieldName]?.toArray();
                if (fieldVals) {
                    this._createHierarchy(statistics.hierarchy, fieldVals[0], fieldVals.slice(1));
                }
            });
        } else if (aggregate === EAggregateType.KEYWORDS) {
            // TODO: get keywords statistics
        } else if (aggregate === EAggregateType.HISTOGRAM) {
            // get the histogram statistics
            statistics.histogram = {
                type: "histogram",
                count: subset.hasElements.length,
                field: `Numberic[${fieldName}]`,
                join: "",
                max: 0,
                mean: 0,
                median: 0,
                min: 0,
                stdev: 0,
                sum: 0,
                values: [],
                // override with the actual values
                ...(subset.hasElements.getVector(fieldName).sum() > 0 &&
                    subset.hasElements.aggr({
                        name: "histogram",
                        field: fieldName,
                        type: aggregate,
                    })),
            };
        } else {
            // get the distribution values
            statistics[aggregate as string] = subset.hasElements.aggr({
                name: aggregate,
                field: fieldName,
                type: aggregate,
            });
            if (aggregate === EAggregateType.TIMELINE) {
                // TODO: enrich the statistics with the timeline
            }
        }
        // return the statistics
        return statistics;
    }

    /**
     * Creates the hierarchy.
     * @param hierarchy - The hierarchy container.
     * @param current - The current value.
     * @param next - The array of next values.
     */
    _createHierarchy(hierarchy: IHierarchyChildObject[], current: string, next: string[]) {
        // check if that is the last value
        if (next.length === 0) {
            for (const child of hierarchy) {
                if (child.name === current) {
                    child.size += 1;
                    return;
                }
            }
            hierarchy.push({ name: current, size: 1, children: [] });
            return;
        }

        let object;
        for (const child of hierarchy) {
            if (child.name === current) {
                child.size += 1;
                object = child;
                break;
            }
        }
        if (!object) {
            const length = hierarchy.push({ name: current, size: 1, children: [] });
            object = hierarchy[length - 1];
        }
        // continue
        this._createHierarchy(object.children, next[0], next.slice(1));
    }
}
