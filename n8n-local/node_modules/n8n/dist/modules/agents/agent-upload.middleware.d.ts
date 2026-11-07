import type { RequestHandler } from 'express';
import multer from 'multer';
export declare function isAllowedAgentFile(file: Pick<Express.Multer.File, 'originalname'>): boolean;
export declare function describeMulterError(error: multer.MulterError): string;
export declare function cleanupUploadedTempFiles(files: Express.Multer.File[]): Promise<void>;
export declare class AgentUploadMiddleware {
    private readonly upload;
    array(fieldName: string): RequestHandler;
}
