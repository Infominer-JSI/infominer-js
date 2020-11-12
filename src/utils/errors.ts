// the general error class
class GeneralError extends Error {
    public statusCode: number;
    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
    }
}

class BadRequest extends GeneralError {
    constructor(message: string) {
        super(400, message);
    }
}
class NotFound extends GeneralError {
    constructor(message: string) {
        super(404, message);
    }
}

export { GeneralError, BadRequest, NotFound };
