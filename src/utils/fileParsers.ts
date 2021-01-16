/***********************************************
 * File Parsers
 * This exports the functions used to parse
 * the file values.
 */

// import utils
import Parser from "csv-parse/lib/sync";
import fs, { promises as fsp } from "fs";
import readline from "readline";

// import default variables
import {
    DEFAULT_DELIMITER,
    MAX_ROW_PROCESSED,
    REGEX_CATEGORY,
    REGEX_NUMBER,
    ID2LABEL,
    LABEL2ID,
    REGEX_CLASS,
} from "../config/static";

// get the file rows
async function getFileRows(filepath: string, nRows?: number) {
    // get the file content and extract the header
    const content = fs.createReadStream(filepath);
    const rl = readline.createInterface({ input: content, crlfDelay: Infinity });
    // get the content rows
    const rows: string[] = [];
    for await (const line of rl) {
        rows.push(line.trim());
        // check if it has to break the loop
        if (nRows && rows.length >= nRows) {
            break;
        }
    }
    // return the rows
    return rows;
}

// detects the delimiter used in the data set
export async function parseDelimiter(filepath: string, delimiters = [",", ";", "|", "~"]) {
    try {
        // get the file content and extract the header
        const header = (await getFileRows(filepath, 1))[0];
        // check if the header has any of the delimiters
        const regex = new RegExp(`[${delimiters.join()}]`, "g");
        const foundDelimiters = [...new Set(header.match(regex))];
        if (foundDelimiters.length === 0) {
            // if no delimiters, then return the default one
            return { delimiter: DEFAULT_DELIMITER, count: 1 };
        }
        // take the delimiter that has the most fields
        const selectedDelimiter = { delimiter: "", count: 0 };
        for (const delimiter of foundDelimiters) {
            const output: string[][] = Parser(header, { delimiter, trim: true });
            const columnNum = output[0].length;
            if (selectedDelimiter.count < columnNum) {
                selectedDelimiter.delimiter = delimiter;
                selectedDelimiter.count = columnNum;
            }
        }
        // return the selected delimiter
        return selectedDelimiter;
    } catch (error) {
        // return the error
        return { error };
    }
}

function validateValue(value: string) {
    const category = value.match(REGEX_CATEGORY);
    const xclass = value.match(REGEX_CLASS);
    if (!value.match(REGEX_NUMBER)) {
        return LABEL2ID.number;
    } else if (Date.parse(value)) {
        return LABEL2ID.datetime;
    } else if (category && category.length === 1 && category[0] === value) {
        return LABEL2ID.category;
    } else if (xclass && xclass.length === 1 && xclass[0] === value) {
        return LABEL2ID.class;
    } else {
        return LABEL2ID.text;
    }
}

// parses and assigns the column types
export async function parseColumns(filepath: string, delimiter: string) {
    try {
        // get the file rows used to identify the column types
        const content = (await getFileRows(filepath, MAX_ROW_PROCESSED)).join("\n");
        const options = {
            delimiter,
            columns: true,
            trim: true,
            skip_lines_with_error: true,
            skip_empty_lines: true,
        };
        // get file rows
        const rows: { [key: string]: any }[] = Parser(content, options);
        // get the header values
        const columns = Object.keys(rows[0]);
        const columnTypes: string[] = [];
        for (const column of columns) {
            const columnType = rows.map((row) => validateValue(row[column]));
            columnTypes.push(ID2LABEL[Math.min(...columnType)]);
        }
        // prepare the file field list
        const fields = [];
        for (let i = 0; i < columns.length; i++) {
            fields.push({ name: columns[i], type: columnTypes[i], included: true });
        }
        // return the fields
        return { fields };
    } catch (error) {
        return { error };
    }
}

// parses the file using the given delimiter
export async function parseFile(filepath: string, delimiter: string) {
    try {
        // get the file content
        const content = await fsp.readFile(filepath);
        // configure parser options
        const options = {
            delimiter,
            columns: true,
            trim: true,
            skip_lines_with_error: true,
            skip_empty_lines: true,
        };
        // get the document rows
        return { rows: Parser(content, options) };
    } catch (error) {
        // return the error
        return { error };
    }
}
