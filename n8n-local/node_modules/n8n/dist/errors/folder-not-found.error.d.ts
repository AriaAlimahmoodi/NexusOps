import { OperationalError } from '@n8n/errors';
export declare class FolderNotFoundError extends OperationalError {
    constructor(folderId: string);
}
