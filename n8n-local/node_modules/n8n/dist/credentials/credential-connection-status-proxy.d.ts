import type { EntityManager } from '@n8n/typeorm';
import type { ICredentialConnectionStatusProvider, UserConnection } from './credential-connection-status-provider.interface';
export declare class CredentialConnectionStatusProxy implements ICredentialConnectionStatusProvider {
    private provider?;
    setProvider(provider: ICredentialConnectionStatusProvider): void;
    findMyConnections(userId: string, credentialIds: string[]): Promise<Map<string, UserConnection>>;
    countConnectedUsers(credentialId: string): Promise<number>;
    deleteAllUserEntries(credentialId: string, em?: EntityManager): Promise<void>;
    cleanupOrphanedEntriesForUsers(userIds: string[], em?: EntityManager, credentialId?: string): Promise<void>;
    cleanupOrphanedEntriesForProjects(credentialId: string, projectIds: string[], em?: EntityManager): Promise<void>;
}
