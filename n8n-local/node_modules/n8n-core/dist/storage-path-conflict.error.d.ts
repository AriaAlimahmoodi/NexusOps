import { UserError } from 'n8n-workflow';
export declare class StoragePathError extends UserError {
    static conflict(): StoragePathError;
    static taken(oldPath: string, newPath: string): StoragePathError;
}
