import { Request, Response, NextFunction } from 'express';
export declare const entryController: {
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    getOne(req: Request, res: Response, next: NextFunction): Promise<void>;
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    remove(req: Request, res: Response, next: NextFunction): Promise<void>;
    parseSms(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=entry.controller.d.ts.map