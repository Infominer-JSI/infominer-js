/***********************************************
 * Dataset Model
 * This model contains the functions for
 * sending requests to the postgresql database.
 */

// import model
import { query } from "./index.model";

// export dataset related queries
export default class DatasetModel {
    private _tableName: string;

    // initialize the
    constructor(tableName: string) {
        this._tableName = tableName;
    }

    // get all datasets that match the parameters
    async getDatasets(conditions: Record<string, any>) {
        let count = 1;
        // get the parameters
        const params = Object.values(conditions);
        // create the where string of the command
        const SQLWhere = Object.keys(conditions).map((attr: string) => `${attr} = $${count++}`);
        // construct the SQL command and get the results
        const command = `SELECT * FROM ${this._tableName} ${
            SQLWhere.length ? `WHERE ${SQLWhere.join(" AND ")}` : ""
        } ORDER BY id DESC;`;
        const results = await query(command, params);
        return results.rows;
    }

    // get all datasets that match the parameters
    async createDataset(values: Record<string, any>) {
        let count = 1;
        // get the document values
        const params = Object.values(values);
        // get the document attribute names
        const attributes = Object.keys(values);
        // create the where string of the command
        const indicators = attributes.map(() => `$${count++}`);
        // construct the SQL command and get the results
        const command = `INSERT INTO ${this._tableName} (${attributes.join(
            ","
        )}) VALUES (${indicators.join(",")}) RETURNING *;`;
        const results = await query(command, params);
        return results.rows;
    }

    // delete all datasets that match the parameters
    async deleteDataset(conditions: Record<string, any>) {
        let count = 1;
        // get the parameters
        const params = Object.values(conditions);
        // create the where string of the command
        const SQLWhere = Object.keys(conditions).map((attr: string) => `${attr} = $${count++}`);
        // construct the SQL command and get the results
        const command = `DELETE FROM ${this._tableName} ${
            SQLWhere.length ? `WHERE ${SQLWhere.join(" AND ")}` : ""
        };`;
        const results = await query(command, params);
        return results.rows;
    }

    // update the datasets with values that match the conditions
    async updateDataset(values: Record<string, any>, conditions: Record<string, any>) {
        let count = 1;
        // create the set strings of the command
        const SQLSet = Object.keys(values).map((attr: string) => `${attr} = $${count++}`);
        // create the where string of the command
        const SQLWhere = Object.keys(conditions).map((attr: string) => `${attr} = $${count++}`);
        // construct the SQL command and get the results
        const command = `UPDATE ${this._tableName} SET ${SQLSet.join(", ")} ${
            SQLWhere.length ? `WHERE ${SQLWhere.join(" AND ")}` : ""
        } RETURNING *;`;
        // get the parameters
        const params = [...Object.values(values), ...Object.values(conditions)];
        const results = await query(command, params);
        return results.rows;
    }
}
