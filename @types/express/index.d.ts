export {};

declare global {
    namespace Express {
        interface Request {
            owner: string;
        }
    }
}
