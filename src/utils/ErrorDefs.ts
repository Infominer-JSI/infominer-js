/***********************************************
 * Error Definitions
 * This defines the different error types that
 * are used throughout the project.
 */

class GeneralError extends Error {
    public statusCode: number;
    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
    }
}

// the bad request error
class BadRequest extends GeneralError {
    constructor(message: string) {
        super(400, message);
    }
}

// the route not found error
class RouteNotFound extends GeneralError {
    constructor(message: string) {
        super(404, message);
    }
}

// the server side error
class ServerError extends GeneralError {
    constructor(message: string) {
        super(500, message);
    }
}

export { GeneralError, BadRequest, RouteNotFound, ServerError };
