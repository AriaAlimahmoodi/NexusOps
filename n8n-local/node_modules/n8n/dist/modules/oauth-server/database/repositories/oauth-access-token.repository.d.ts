import { BaseRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { AccessToken } from '../entities/oauth-access-token.entity';
type NewAccessToken = {
    token: string;
    clientId: string;
    userId: string;
};
export declare class AccessTokenRepository extends BaseRepository<AccessToken> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    insertToken(token: NewAccessToken, ctx: OperationContext): Promise<void>;
    isActive(token: string): Promise<boolean>;
}
export {};
