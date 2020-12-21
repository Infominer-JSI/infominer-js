import { resolve } from "path";
import { config } from "dotenv";

// configure process environment
config({ path: resolve(__dirname, "..", "..", "env", ".env") });

// export the environment variables
export default {
    env: process.env.NODE_ENV,
    pg: {
        host: process.env.PG_HOST || "127.0.0.1",
        port: parseInt(process.env.PG_PORT || "", 10) || 5432,
        user: process.env.PG_USER || "postgres",
        database: process.env.PG_DATABASE || "infominer",
        password: process.env.PG_PASSWORD,
        connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT || "", 10) || 3000,
    },
    login: {
        google: {
            clientID: process.env.GOOGLE_CLIENT_ID || "clientID",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "clientSecret",
            callbackURL: process.env.GOOGLE_CALLBACK_URL || "callbackURL",
        },
        twitter: {
            consumerKey: process.env.TWITTER_CONSUMER_KEY || "consumerKey",
            consumerSecret: process.env.TWITTER_CONSUMER_SECRET || "clientSecret",
            callbackURL: process.env.TWITTER_CALLBACK_URL || "callbackURL",
        },
    },
};
