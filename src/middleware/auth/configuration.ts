// import passport interface
import { Profile, PassportStatic } from "passport";

// import strategies
import { Strategy as TwitterStrategy } from "passport-twitter";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

// get strategy configurations
import config from "../../config/config";

// verifies the profile
function verifyProfile(_aToken: string, _rToken: string, profile: Profile, done: any) {
    const user = {
        id: profile.id,
        username: profile.displayName,
        provider: profile.provider,
    };
    // return the user profile
    return done(undefined, user);
}

// prepare the list of strategies
const strategies: { Strategy: any; config: any }[] = [
    { Strategy: TwitterStrategy, config: config.login.twitter },
    { Strategy: GoogleStrategy, config: config.login.google },
];

// export the twitter strategy configuration assignment
export default function (passport: PassportStatic) {
    // serialize the user for the session
    passport.serializeUser((user, done) => {
        return done(null, user);
    });
    // deserialize the user for the session
    passport.deserializeUser((obj: any, done) => {
        return done(null, obj);
    });
    // configure the strategies
    for (const { Strategy, config } of strategies) {
        passport.use(new Strategy(config, verifyProfile));
    }
}
