export default {
    pg: {
        host: process.env.PG_HOST || "127.0.0.1",
        port: parseInt(process.env.PG_PORT || "", 10) || 5432,
        database: process.env.PG_DATABASE || "infominer",
        user: process.env.PG_USERNAME || "postgres",
        password: process.env.PG_PASSWORD,
        connectionTimeoutMillis: 30000,
    },
};
