import { BaseRepository, TransactionRunner, User, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
export declare class OAuthGrantRepository extends BaseRepository<User> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    deleteGrantsForDisabledUsers(): Promise<void>;
    lockUserForGrant(userId: string, ctx: OperationContext): Promise<User | null>;
    private findLockedUser;
    deleteUserGrants(userId: string, ctx: OperationContext): Promise<void>;
}
