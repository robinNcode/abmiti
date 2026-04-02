import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../types';
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
export declare const authenticate: (req: Request, _res: Response, next: NextFunction) => void;
export declare const validate: (req: Request, _res: Response, next: NextFunction) => void;
export declare const rateLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const notFoundHandler: (req: Request, res: Response) => void;
//# sourceMappingURL=index.d.ts.map