/***********************************************
 * Index Model
 * This model establishes a connection with the
 * postgresql database and enables querying.
 */

// import modules
import { Pool } from "pg";

// import configurations
import config from "../config/config";

// initialize the postgres pool
const pool = new Pool(config.pg);

// create the query function
const query = async (command: string, params: (string | number)[]) => {
    return await pool.query(command, params);
};

export { query };
