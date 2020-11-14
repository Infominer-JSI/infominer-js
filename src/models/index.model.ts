import { Pool } from "pg";

// get the configurations
import config from "../config/config";

// initialize the postgres pool
const pool = new Pool(config.pg);

// create the query function
const query = async (command: string, params: (string | number)[]) => {
    return await pool.query(command, params);
};

// export the functions for accessing the postgres database
export { query };
