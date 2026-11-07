import { OperationContext, TransactionRunner, User, UserRepository } from '@n8n/db';
import { DataSource, type DeepPartial } from '@n8n/typeorm';
import { TrustedSourceIdentityEntity, type TrustedSourceIdentityStatus } from '../entities/trusted-source-identity.entity';
export type InsertTrustedSourceIdentityRow = Pick<TrustedSourceIdentityEntity, 'sourceId' | 'subject' | 'userId' | 'provenance' | 'status'>;
export declare class TrustedSourceIdentityRepository {
    private readonly users;
    private readonly store;
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner, users: UserRepository);
    findBinding(sourceId: string, subject: string, ctx?: OperationContext): Promise<{
        userId: string;
        status: TrustedSourceIdentityStatus;
    } | null>;
    clearByTrustedSourceId(trustedSourceId: string, ctx?: OperationContext): Promise<void>;
    findBySubject(sourceId: string, subject: string, ctx?: OperationContext): Promise<TrustedSourceIdentityEntity | null>;
    findUserByEmail(email: string, ctx?: OperationContext): Promise<User | null>;
    globalRoleExists(slug: string, ctx?: OperationContext): Promise<boolean>;
    projectRolesExist(slugs: string[], ctx?: OperationContext): Promise<boolean>;
    touchLastSeen(sourceId: string, subject: string, seenAt: Date, ctx?: OperationContext): Promise<void>;
    insertIfAbsent(row: InsertTrustedSourceIdentityRow, ctx?: OperationContext): Promise<void>;
    createUserWithBinding(ctx: OperationContext, user: DeepPartial<User>, binding: Pick<InsertTrustedSourceIdentityRow, 'sourceId' | 'subject' | 'provenance' | 'status'>, projectRoles?: {
        projectId: string;
        role: string;
    }[]): Promise<User>;
}
