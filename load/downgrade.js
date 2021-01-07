// import the generate schema
const GenerateSchema = require("./GenerateSchema");

// initialize the generate schema
const generateSchema = new GenerateSchema();

// upgrade the database
generateSchema
    .execute([{ path: "postgres", files: ["downgrade.v2.sql", "downgrade.v1.sql"] }])
    .then(() => generateSchema.close())
    .catch(console.log);
