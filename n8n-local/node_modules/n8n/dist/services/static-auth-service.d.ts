import { Request, Response, NextFunction } from 'express';
export declare class StaticAuthService {
    static getStaticAuthMiddleware(endpointAuthToken: string, headerName?: string): ((req: Request, res: Response, next: NextFunction) => void) | null;
}
