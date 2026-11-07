import type { McpClientConnectedPeriod } from '@n8n/api-types';
import { BaseRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { UserConsent } from '../entities/oauth-user-consent.entity';
type ConsentOwner = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
};
export type FindConnectedClientsOptions = {
    userId?: string;
    withOwner?: boolean;
    name?: string;
    ownerId?: string;
    clientIds?: string[];
    connected?: McpClientConnectedPeriod;
    now: number;
    skip?: number;
    take?: number;
};
export declare class UserConsentRepository extends BaseRepository<UserConsent> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    saveGrant(userId: string, clientId: string, scope: string[], ctx: OperationContext): Promise<void>;
    findGrant(userId: string, clientId: string, ctx: OperationContext): Promise<UserConsent | null>;
    findConnectedClients(options: FindConnectedClientsOptions): Promise<{
        rows: UserConsent[];
        total: number;
    }>;
    findConsentOwners(): Promise<ConsentOwner[]>;
    countConnectedConsents(userId?: string): Promise<number>;
}
export {};
