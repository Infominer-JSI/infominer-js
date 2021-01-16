import qm from "qminer";
import {
    EAggregateType,
    IBaseDatasetField,
    IHierarchyObject,
    IProcessing,
    ISubsetRecord,
} from "../../../interfaces";

/**
 * Calculates the statistics of the subset and creates a new method.
 * @param base - The qminer base.
 * @param subsetId - The subset ID.
 * @param fields - The base fields metadata.
 */
export function aggregates(
    subset: ISubsetRecord,
    fields: IBaseDatasetField[],
    params: IProcessing
) {
    const elements = subset.hasElements;
    // calculates the aggregates
    const aggregates = fields
        .map((field) =>
            field.aggregate
                ? {
                      field: field.name,
                      type: field.aggregate,
                      statistics: _aggregatesByField(elements, field, params),
                  }
                : null
        )
        .filter((v) => v);
    return aggregates;
}

/**
 * Calculates the subset field statistics.
 * @param base - The QMiner base.
 * @param elements - The subset record.
 * @param field - The field metadata.
 */
function _aggregatesByField(elements: qm.RecordSet, field: IBaseDatasetField, params: IProcessing) {
    // get the field metadata
    const { name: fieldName, aggregate } = field;
    // calculate the aggregates
    let statistics: { [key: string]: any } = {};
    if (aggregate === EAggregateType.HIERARCHY) {
        // get the hierarchy statistics
        statistics = {
            type: "hierarchy",
            field: `Multinomial[${fieldName}]`,
            values: [],
        };
        elements.each((rec) => {
            const fieldVals: string[] | null = rec[fieldName]?.toArray();
            if (fieldVals) {
                createHierarchy(statistics.values, fieldVals[0], fieldVals.slice(1));
            }
        });
    } else if (aggregate === EAggregateType.KEYWORDS) {
        statistics = elements.aggr({
            name: aggregate,
            field: fieldName,
            type: aggregate,
            stemmer: "porter",
            stopwords: params.stopwords,
        });
        if (statistics && statistics.keywords && !statistics.keywords.length) {
            statistics.keywords.push({ keyword: (elements[0] as qm.Record)[fieldName], weight: 1 });
        }
    } else if (aggregate === EAggregateType.HISTOGRAM) {
        // get the histogram statistics
        statistics = {
            type: "histogram",
            count: elements.length,
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
            ...(elements.getVector(fieldName).sum() > 0 &&
                elements.aggr({
                    name: "histogram",
                    field: fieldName,
                    type: aggregate,
                })),
        };
    } else if (aggregate === EAggregateType.COUNT) {
        // get the count statistics
        statistics = elements.aggr({
            name: aggregate,
            field: fieldName,
            type: aggregate,
        });
    } else if (aggregate === EAggregateType.TIMELINE) {
        // get the timeline statistics
        statistics.timeline = elements.aggr({
            name: aggregate,
            field: fieldName,
            type: EAggregateType.TIMELINE,
        });
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
function createHierarchy(hierarchy: IHierarchyObject[], current: string, next: string[]) {
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
    createHierarchy(object.children, next[0], next.slice(1));
}
