import {
    EAggregateType,
    IBaseDatasetField,
    IFormatter,
    IHierarchyObject,
    ISubsetFormatter,
    IMethodRecord,
    ISubsetRecord,
    IMethodFormatter,
} from "../../interfaces";

import qm from "qminer";
import { BadRequest } from "../../utils/ErrorDefs";

export default class MethodManager {
    private formatter: IFormatter;

    /**
     * Creates a new MethodManager instance.
     * @param formatter - The formating functions.
     */
    constructor(formatter: IFormatter) {
        this.formatter = formatter;
    }

    /////////////////////////////////////////////
    // METHOD HANDLERS
    /////////////////////////////////////////////

    /**
     * Gets all of the non-deleted methods.
     * @param base - The qminer base.
     */
    getMethods(base: qm.Base) {
        const methods = base.store("Methods").allRecords;
        if (methods && !methods.empty && methods[0] && methods[0].deleted !== undefined) {
            methods.filterByField("deleted", false);
        }
        return {
            methods: methods.map((rec) =>
                this.formatter.method(rec as IMethodRecord)
            ) as IMethodFormatter[],
        };
    }

    /**
     * Gets the specific method metadata.
     * @param base - The qminer base.
     * @param methodId - The method ID.
     */
    getMethod(base: qm.Base, methodId: number) {
        /**
         * Gets all of the undeleted records.
         * @param recordSet - The methods record set.
         */
        const getMethodSubsets = (recordSet: qm.RecordSet) => {
            if (!recordSet.empty && recordSet[0] && recordSet[0].deleted !== undefined) {
                recordSet.filterByField("deleted", false);
            }
            return recordSet;
        };
        if (!Number.isInteger(methodId)) {
            throw new BadRequest(`Invalid method | id=${methodId}`);
        }
        // get the subset record
        const method = base.store("Methods")[methodId] as IMethodRecord;
        if (!method || method.deleted) {
            throw new BadRequest(`Method does not exist | id=${methodId}`);
        }
        // prepare the response
        const response = {
            methods: this.formatter.method(method),
            subsets: [] as ISubsetFormatter[],
        };
        // get all associated methods
        if (method.appliedOn) {
            response.subsets.push(this.formatter.subset(method.appliedOn as ISubsetRecord));
        }
        if (!method.produced?.empty) {
            const produced = getMethodSubsets(method.produced as qm.RecordSet);
            response.subsets.push(
                ...produced.map((rec) => this.formatter.subset(rec as ISubsetRecord))
            );
        }
        return response;
    }

    /**
     * Deletes the methods and its associate subsets.
     * @param base - The qminer base.
     * @param methodId - The method ID.
     * @param callback - The function called to delete subsets related to the method.
     */
    deleteMethod(base: qm.Base, methodId: number, callback: any) {
        if (!Number.isInteger(methodId)) {
            throw new BadRequest(`Invalid method | id=${methodId}`);
        }
        const method = base.store("Methods")[methodId] as IMethodRecord;
        if (!method || method.deleted) {
            return true;
        }
        if (method.deleted !== undefined && method.deleted === false) {
            method.deleted = true;
            method.produced?.each((rec: qm.Record) => {
                callback(base, rec.$id, this.deleteMethod.bind(this));
            });
        }
        return true;
    }

    /////////////////////////////////////////////
    // SPECIFIC FUNCTIONALITIES
    /////////////////////////////////////////////

    /**
     * Calculates the statistics of the subset and creates a new method.
     * @param base - The qminer base.
     * @param subsetId - The subset ID.
     * @param fields - The base fields metadata.
     */
    aggregates(base: qm.Base, subsetId: number, fields: IBaseDatasetField[]) {
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
        base.store("Methods")[methodId]?.$addJoin("appliedOn", subsetId);
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
            subset.hasElements.each((rec) => {
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
    _createHierarchy(hierarchy: IHierarchyObject[], current: string, next: string[]) {
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
