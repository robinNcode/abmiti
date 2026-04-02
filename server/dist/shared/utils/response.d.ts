import { Response } from 'express';
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number, meta?: Record<string, unknown>) => Response;
export declare const sendCreated: <T>(res: Response, data: T, message?: string) => Response;
//# sourceMappingURL=response.d.ts.map