import { BaseRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { RefreshToken } from '../entities/oauth-refresh-token.entity';
type NewRefreshToken = {
    token: string;
    clientId: string;
    userId: string;
    expiresAt: number;
    scope: string[];
    resource: string;
};
export declare class RefreshTokenRepository extends BaseRepository<RefreshToken> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    findByToken(token: string, clientId: string, ctx: OperationContext): Promise<RefreshToken | null>;
    deleteValidByToken(token: string, clientId: string, now: number, ctx: OperationContext): Promise<number>;
    insertToken(token: NewRefreshToken, ctx: OperationContext): Promise<void>;
}
export {};
