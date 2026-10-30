import { Request, Response, NextFunction } from 'express';
export declare const budgetController: {
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    getByMonth(req: Request, res: Response, next: NextFunction): Promise<void>;
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    remove(req: Request, res: Response, next: NextFunction): Promise<void>;
    copy(req: Request, res: Response, next: NextFunction): Promise<void>;
    addLine(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateLine(req: Request, res: Response, next: NextFunction): Promise<void>;
    removeLine(req: Request, res: Response, next: NextFunction): Promise<void>;
    reorderLines(req: Request, res: Response, next: NextFunction): Promise<void>;
    templates(req: Request, res: Response, next: NextFunction): Promise<void>;
    saveAsTemplate(req: Request, res: Response, next: NextFunction): Promise<void>;
    fromTemplate(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteTemplate(req: Request, res: Response, next: NextFunction): Promise<void>;
    summary(req: Request, res: Response, next: NextFunction): Promise<void>;
    lineEntries(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=budget.controller.d.ts.map