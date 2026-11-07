import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
export declare class DataTableFileCleanupService {
    private readonly globalConfig;
    private readonly logger;
    private readonly uploadDir;
    constructor(globalConfig: GlobalConfig, logger: Logger);
    private isErrnoException;
    private isNotFound;
    cleanupOrphanedFiles(signal: AbortSignal): Promise<void>;
    deleteFile(fileId: string): Promise<void>;
}
