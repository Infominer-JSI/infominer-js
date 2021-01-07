// import the generate schema
const GenerateSchema = require("./GenerateSchema");

// initialize the generate schema
const generateSchema = new GenerateSchema();

// upgrade the database
generateSchema
    .execute([{ path: "postgres", files: ["upgrade.v1.sql", "upgrade.v2.sql"] }])
    .then(() => generateSchema.close())
    .catch(console.log);
