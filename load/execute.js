// parse argument options
const argv = require("minimist")(process.argv.slice(2));

// import the generate schema
const GenerateSchema = require("./GenerateSchema");

// initialize the generate schema
const generateSchema = new GenerateSchema();

const files = argv.files.split(",");

// upgrade the database
generateSchema
    .execute([{ path: "postgres", files }])
    .then(() => generateSchema.close())
    .catch(console.log);
