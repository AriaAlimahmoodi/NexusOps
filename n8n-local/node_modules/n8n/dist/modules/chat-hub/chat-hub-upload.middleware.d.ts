import { GlobalConfig } from '@n8n/config';
import type { RequestHandler } from 'express';
export declare class ChatHubUploadMiddleware {
    private readonly upload;
    constructor(globalConfig: GlobalConfig);
    array(fieldName: string): RequestHandler;
}
