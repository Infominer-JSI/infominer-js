// import modules
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

// import configuration
const config = require("./config");

class GenerateSchema {
    constructor() {
        // establish connection with the database
        this._pool = new Pool(config);
    }

    // execute the PostgreSQL statements
    async executeFile(folder, file) {
        const filepath = path.resolve(__dirname, folder, file);
        console.log(`Executing:     ${filepath}`);
        const statement = fs.readFileSync(filepath).toString("utf8");
        try {
            await this._pool.query(statement);
        } catch (error) {
            console.log(error);
        } finally {
            console.log(`Finished file: ${filepath}`);
        }
    }

    // execute the instructions
    async execute(instructions) {
        for (const { path, files } of instructions) {
            for (const file of files) {
                try {
                    await this.executeFile(path, file);
                } catch (error) {
                    console.log("Error:", error);
                } finally {
                    console.log("Finished");
                }
            }
        }
    }

    // close the connection
    async close() {
        await this._pool.end();
    }
}

module.exports = GenerateSchema;
