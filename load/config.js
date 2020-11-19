const { resolve } = require("path");
const { config } = require("dotenv");

// configure process environment
config({ path: resolve(__dirname, "..", "env", ".env") });

module.exports = {
    host: process.env.PG_HOST || "127.0.0.1",
    port: parseInt(process.env.PG_PORT || "", 10) || 5432,
    user: process.env.PG_USER || "postgres",
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABSE || "infominer",
    connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT || "", 10) || 3000,
    multipleStatements: true,
};
