import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import type { RequestHandler } from 'express';
import { DataTableSizeValidator } from './data-table-size-validator.service';
import { DataTableRepository } from './data-table.repository';
import { type UploadMiddleware } from './types';
export declare class MulterUploadMiddleware implements UploadMiddleware {
    private readonly globalConfig;
    private readonly sizeValidator;
    private readonly dataTableRepository;
    private readonly logger;
    private upload;
    private readonly uploadDir;
    private quotaCheckChain;
    constructor(globalConfig: GlobalConfig, sizeValidator: DataTableSizeValidator, dataTableRepository: DataTableRepository, logger: Logger);
    private ensureUploadDirExists;
    private getUploadDirSize;
    single(fieldName: string): RequestHandler;
    private enqueueQuotaCheck;
    private enforceQuotaPostUpload;
    private removeUpload;
}
