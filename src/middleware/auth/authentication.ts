// import interfaces
import { Express, NextFunction, Request, Response } from "express";
import { PassportStatic } from "passport";

import { UserNotAuthorized } from "../../utils/ErrorDefs";

// configure the authentication routes
export default function (app: Express, passport: PassportStatic, dev_mode?: boolean) {
    // ///////////////////////////////////////////
    // google authentication
    // ///////////////////////////////////////////

    app.get(
        "/api/v1/auth/google",
        passport.authenticate("google", {
            failureRedirect: "/login",
            scope: ["profile"],
        })
    );

    app.get(
        "/api/v1/auth/google/callback",
        passport.authenticate("google", {
            failureRedirect: "/login",
        }),
        (_req: Request, res: Response) => {
            res.redirect("/");
        }
    );

    // ///////////////////////////////////////////
    // twitter authentication
    // ///////////////////////////////////////////

    app.get(
        "/api/v1/auth/twitter",
        passport.authenticate("twitter", {
            failureRedirect: "/login",
        })
    );

    app.get(
        "/api/v1/auth/twitter/callback",
        passport.authenticate("twitter", {
            failureRedirect: "/login",
        }),
        (_req: Request, res: Response) => {
            res.redirect("/");
        }
    );

    // ///////////////////////////////////////////
    // logout
    // ///////////////////////////////////////////

    app.get("/api/v1/auth/logout", (req: Request, res: Response) => {
        req.logout();
        return res.redirect("/login");
    });

    // ///////////////////////////////////////////
    // check client session connection
    // ///////////////////////////////////////////

    app.get("/api/v1/auth/account", (req: Request, res: Response) => {
        let authentication;
        if (!dev_mode) {
            // prepare authentication object
            authentication = req.isAuthenticated()
                ? { authenticated: true, user: req.user }
                : { authenticated: false, user: null };
        } else {
            authentication = { authenticated: true, user: "development" };
        }
        // response with a json object
        res.json(authentication);
    });

    // ///////////////////////////////////////////
    // handle security checks
    // ///////////////////////////////////////////

    if (!dev_mode) {
        // authentication checking
        app.all("/api/*", (req: Request, _res: Response, next: NextFunction) => {
            // check if the user is authenticated or not
            return !req.isAuthenticated()
                ? next(new UserNotAuthorized("user not authenticated"))
                : next();
        });
    }
}
