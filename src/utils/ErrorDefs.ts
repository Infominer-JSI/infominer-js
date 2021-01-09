/***********************************************
 * Error Definitions
 * This defines the different error types that
 * are used throughout the project.
 */

class GeneralError extends Error {
    public statusCode: number;
    public output: string;
    constructor(statusCode: number, message: string, output: string) {
        super(message);
        this.statusCode = statusCode;
        this.output = output;
    }
}

// the bad request error
class BadRequest extends GeneralError {
    constructor(message: string) {
        super(400, message, "Bad Request");
    }
}

// user not authorized error
class UserNotAuthorized extends GeneralError {
    constructor(message: string) {
        super(401, message, "User Not Authorized");
    }
}

// the route not found error
class RouteNotFound extends GeneralError {
    constructor(message: string) {
        super(404, message, "Route Not Found");
    }
}

// the server side error
class ServerError extends GeneralError {
    constructor(message: string) {
        super(500, message, "Server Side Error");
    }
}

export { GeneralError, BadRequest, RouteNotFound, ServerError, UserNotAuthorized };
