import type { User } from '@n8n/db';
import type { Workflow } from 'n8n-workflow';
import { CacheService } from '@n8n/backend-services';
interface CacheEntry {
    userId: string;
    lastSeen: string;
    clientId: string;
}
export interface WriteLock {
    clientId: string;
    userId: string;
}
export declare class CollaborationState {
    private readonly cache;
    readonly inactivityCleanUpTime: number;
    constructor(cache: CacheService);
    private lockChains;
    private serializeLockOp;
    addCollaborator(workflowId: Workflow['id'], userId: User['id'], clientId: string): Promise<void>;
    removeCollaborator(workflowId: Workflow['id'], clientId: string): Promise<void>;
    getCollaborators(workflowId: Workflow['id']): Promise<CacheEntry[]>;
    private formWorkflowCacheKey;
    private splitToExpiredAndStillActive;
    private removeExpiredCollaborators;
    private parseCacheHashToCollaborators;
    private hasSessionExpired;
    readonly writeLockTtl: number;
    setWriteLock(workflowId: Workflow['id'], clientId: string, userId: User['id']): Promise<void>;
    acquireWriteLock(workflowId: Workflow['id'], clientId: string, userId: User['id']): Promise<boolean>;
    renewWriteLock(workflowId: Workflow['id'], clientId: string): Promise<void>;
    private parseLock;
    getWriteLock(workflowId: Workflow['id']): Promise<WriteLock | null>;
    releaseWriteLock(workflowId: Workflow['id']): Promise<void>;
    releaseWriteLockIfHolder(workflowId: Workflow['id'], clientId: string): Promise<boolean>;
    private formWriteLockCacheKey;
    acquireWriteLockForce(workflowId: Workflow['id'], clientId: string, userId: User['id']): Promise<boolean>;
    addAgentCollaborator(agentId: string, userId: User['id'], clientId: string): Promise<void>;
    removeAgentCollaborator(agentId: string, clientId: string): Promise<void>;
    getAgentCollaborators(agentId: string): Promise<CacheEntry[]>;
    private formAgentCacheKey;
    private removeExpiredAgentCollaborators;
    setAgentWriteLock(agentId: string, clientId: string, userId: User['id']): Promise<void>;
    acquireAgentWriteLock(agentId: string, clientId: string, userId: User['id']): Promise<boolean>;
    renewAgentWriteLock(agentId: string, clientId: string): Promise<void>;
    getAgentWriteLock(agentId: string): Promise<WriteLock | null>;
    getAgentWriteLocks(agentIds: string[]): Promise<Map<string, WriteLock>>;
    releaseAgentWriteLock(agentId: string): Promise<void>;
    releaseAgentWriteLockIfHolder(agentId: string, clientId: string): Promise<boolean>;
    private formAgentWriteLockCacheKey;
    acquireAgentWriteLockForce(agentId: string, clientId: string, userId: User['id']): Promise<boolean>;
}
export {};
