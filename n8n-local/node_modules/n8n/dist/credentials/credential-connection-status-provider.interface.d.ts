import type { EntityManager } from '@n8n/typeorm';
export type UserConnection = {
    accountIdentifier?: string;
};
export interface ICredentialConnectionStatusProvider {
    findMyConnections(userId: string, credentialIds: string[]): Promise<Map<string, UserConnection>>;
    countConnectedUsers(credentialId: string): Promise<number>;
    deleteAllUserEntries(credentialId: string, em?: EntityManager): Promise<void>;
    cleanupOrphanedEntriesForUsers(userIds: string[], em?: EntityManager, credentialId?: string): Promise<void>;
    cleanupOrphanedEntriesForProjects(credentialId: string, projectIds: string[], em?: EntityManager): Promise<void>;
}
