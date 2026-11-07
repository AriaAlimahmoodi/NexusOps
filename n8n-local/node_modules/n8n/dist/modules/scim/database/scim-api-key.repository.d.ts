import { ApiKey, BaseRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
export declare class ScimApiKeyRepository extends BaseRepository<ApiKey> {
    private readonly audience;
    private readonly label;
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    findByUserId(userId: string, ctx: OperationContext): Promise<ApiKey | null>;
    findByKey(apiKey: string, ctx: OperationContext): Promise<ApiKey | null>;
    replaceForUser(userId: string, apiKey: string, ctx: OperationContext): Promise<ApiKey>;
    deleteAllForUser(userId: string, ctx: OperationContext): Promise<void>;
}
