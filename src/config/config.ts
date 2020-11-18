import { resolve } from "path";
import { config } from "dotenv";

// configure process environment
config({ path: resolve(__dirname, "..", "..", "env", ".env") });

// export the environment variables
export default {
    pg: {
        host: process.env.PG_HOST || "127.0.0.1",
        port: parseInt(process.env.PG_PORT || "", 10) || 5432,
        database: process.env.PG_DATABASE || "infominer",
        user: process.env.PG_USERNAME || "postgres",
        password: process.env.PG_PASSWORD,
        connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT || "", 10) || 3000,
    },
};
