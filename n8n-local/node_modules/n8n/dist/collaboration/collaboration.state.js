"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaborationState = void 0;
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const backend_services_1 = require("@n8n/backend-services");
let CollaborationState = class CollaborationState {
    constructor(cache) {
        this.cache = cache;
        this.inactivityCleanUpTime = 15 * constants_1.Time.minutes.toMilliseconds;
        this.lockChains = new Map();
        this.writeLockTtl = 2 * constants_1.Time.minutes.toMilliseconds;
    }
    async serializeLockOp(key, fn) {
        const previous = this.lockChains.get(key) ?? Promise.resolve();
        const next = previous.then(fn, fn);
        const settled = next.catch(() => { });
        this.lockChains.set(key, settled);
        void settled.then(() => {
            if (this.lockChains.get(key) === settled) {
                this.lockChains.delete(key);
            }
        });
        return await next;
    }
    async addCollaborator(workflowId, userId, clientId) {
        const cacheKey = this.formWorkflowCacheKey(workflowId);
        const cacheEntry = {
            [clientId]: `${userId}|${new Date().toISOString()}`,
        };
        await this.cache.setHash(cacheKey, cacheEntry);
    }
    async removeCollaborator(workflowId, clientId) {
        const cacheKey = this.formWorkflowCacheKey(workflowId);
        await this.cache.deleteFromHash(cacheKey, clientId);
    }
    async getCollaborators(workflowId) {
        const cacheKey = this.formWorkflowCacheKey(workflowId);
        const cacheValue = await this.cache.getHash(cacheKey);
        if (!cacheValue) {
            return [];
        }
        const { valid, invalid } = this.parseCacheHashToCollaborators(cacheValue);
        const [expired, stillActive] = this.splitToExpiredAndStillActive(valid);
        const toRemove = [...expired, ...invalid];
        if (toRemove.length > 0) {
            void this.removeExpiredCollaborators(workflowId, toRemove);
        }
        const userMap = new Map();
        for (const entry of stillActive) {
            const existing = userMap.get(entry.userId);
            if (!existing || new Date(entry.lastSeen) > new Date(existing.lastSeen)) {
                userMap.set(entry.userId, entry);
            }
        }
        return Array.from(userMap.values());
    }
    formWorkflowCacheKey(workflowId) {
        return `collaboration:${workflowId}`;
    }
    splitToExpiredAndStillActive(collaborators) {
        const expired = [];
        const stillActive = [];
        for (const collaborator of collaborators) {
            if (this.hasSessionExpired(collaborator.lastSeen)) {
                expired.push(collaborator);
            }
            else {
                stillActive.push(collaborator);
            }
        }
        return [expired, stillActive];
    }
    async removeExpiredCollaborators(workflowId, expiredClients) {
        const cacheKey = this.formWorkflowCacheKey(workflowId);
        await Promise.all(expiredClients.map(async (client) => await this.cache.deleteFromHash(cacheKey, client.clientId)));
    }
    parseCacheHashToCollaborators(workflowCacheEntry) {
        const valid = [];
        const invalid = [];
        for (const [clientId, value] of Object.entries(workflowCacheEntry)) {
            const parts = value.split('|');
            if (parts.length === 1) {
                invalid.push({
                    clientId,
                    userId: '',
                    lastSeen: value,
                });
            }
            else {
                const [userId, lastSeen] = parts;
                valid.push({
                    userId,
                    lastSeen,
                    clientId,
                });
            }
        }
        return { valid, invalid };
    }
    hasSessionExpired(lastSeenString) {
        const expiryTime = new Date(lastSeenString).getTime() + this.inactivityCleanUpTime;
        return Date.now() > expiryTime;
    }
    async setWriteLock(workflowId, clientId, userId) {
        const cacheKey = this.formWriteLockCacheKey(workflowId);
        const lockData = JSON.stringify({ clientId, userId });
        await this.cache.set(cacheKey, lockData, this.writeLockTtl);
    }
    async acquireWriteLock(workflowId, clientId, userId) {
        const cacheKey = this.formWriteLockCacheKey(workflowId);
        return await this.serializeLockOp(cacheKey, async () => {
            const current = await this.getWriteLock(workflowId);
            if (current && current.clientId !== clientId)
                return false;
            await this.setWriteLock(workflowId, clientId, userId);
            return true;
        });
    }
    async renewWriteLock(workflowId, clientId) {
        const cacheKey = this.formWriteLockCacheKey(workflowId);
        await this.serializeLockOp(cacheKey, async () => {
            const currentLock = await this.getWriteLock(workflowId);
            if (currentLock?.clientId === clientId) {
                const lockData = JSON.stringify(currentLock);
                await this.cache.set(cacheKey, lockData, this.writeLockTtl);
            }
        });
    }
    parseLock(lockData) {
        if (!lockData) {
            return null;
        }
        const parsed = (0, n8n_workflow_1.jsonParse)(lockData, { fallbackValue: null });
        if (!parsed?.clientId || !parsed?.userId) {
            return null;
        }
        return parsed;
    }
    async getWriteLock(workflowId) {
        const cacheKey = this.formWriteLockCacheKey(workflowId);
        return this.parseLock(await this.cache.get(cacheKey));
    }
    async releaseWriteLock(workflowId) {
        const cacheKey = this.formWriteLockCacheKey(workflowId);
        await this.cache.delete(cacheKey);
    }
    async releaseWriteLockIfHolder(workflowId, clientId) {
        const cacheKey = this.formWriteLockCacheKey(workflowId);
        return await this.serializeLockOp(cacheKey, async () => {
            const current = await this.getWriteLock(workflowId);
            if (current?.clientId !== clientId)
                return false;
            await this.cache.delete(cacheKey);
            return true;
        });
    }
    formWriteLockCacheKey(workflowId) {
        return `collaboration:write-lock:${workflowId}`;
    }
    async acquireWriteLockForce(workflowId, clientId, userId) {
        const cacheKey = this.formWriteLockCacheKey(workflowId);
        return await this.serializeLockOp(cacheKey, async () => {
            const currentLock = await this.getWriteLock(workflowId);
            if (currentLock && currentLock.userId !== userId)
                return false;
            await this.setWriteLock(workflowId, clientId, userId);
            return true;
        });
    }
    async addAgentCollaborator(agentId, userId, clientId) {
        const cacheKey = this.formAgentCacheKey(agentId);
        const cacheEntry = {
            [clientId]: `${userId}|${new Date().toISOString()}`,
        };
        await this.cache.setHash(cacheKey, cacheEntry);
    }
    async removeAgentCollaborator(agentId, clientId) {
        const cacheKey = this.formAgentCacheKey(agentId);
        await this.cache.deleteFromHash(cacheKey, clientId);
    }
    async getAgentCollaborators(agentId) {
        const cacheKey = this.formAgentCacheKey(agentId);
        const cacheValue = await this.cache.getHash(cacheKey);
        if (!cacheValue) {
            return [];
        }
        const { valid, invalid } = this.parseCacheHashToCollaborators(cacheValue);
        const [expired, stillActive] = this.splitToExpiredAndStillActive(valid);
        const toRemove = [...expired, ...invalid];
        if (toRemove.length > 0) {
            void this.removeExpiredAgentCollaborators(agentId, toRemove);
        }
        const userMap = new Map();
        for (const entry of stillActive) {
            const existing = userMap.get(entry.userId);
            if (!existing || new Date(entry.lastSeen) > new Date(existing.lastSeen)) {
                userMap.set(entry.userId, entry);
            }
        }
        return Array.from(userMap.values());
    }
    formAgentCacheKey(agentId) {
        return `collaboration:agent:${agentId}`;
    }
    async removeExpiredAgentCollaborators(agentId, expiredClients) {
        const cacheKey = this.formAgentCacheKey(agentId);
        await Promise.all(expiredClients.map(async (client) => await this.cache.deleteFromHash(cacheKey, client.clientId)));
    }
    async setAgentWriteLock(agentId, clientId, userId) {
        const cacheKey = this.formAgentWriteLockCacheKey(agentId);
        const lockData = JSON.stringify({ clientId, userId });
        await this.cache.set(cacheKey, lockData, this.writeLockTtl);
    }
    async acquireAgentWriteLock(agentId, clientId, userId) {
        const cacheKey = this.formAgentWriteLockCacheKey(agentId);
        return await this.serializeLockOp(cacheKey, async () => {
            const current = await this.getAgentWriteLock(agentId);
            if (current && current.clientId !== clientId)
                return false;
            await this.setAgentWriteLock(agentId, clientId, userId);
            return true;
        });
    }
    async renewAgentWriteLock(agentId, clientId) {
        const cacheKey = this.formAgentWriteLockCacheKey(agentId);
        await this.serializeLockOp(cacheKey, async () => {
            const currentLock = await this.getAgentWriteLock(agentId);
            if (currentLock?.clientId === clientId) {
                const lockData = JSON.stringify(currentLock);
                await this.cache.set(cacheKey, lockData, this.writeLockTtl);
            }
        });
    }
    async getAgentWriteLock(agentId) {
        const cacheKey = this.formAgentWriteLockCacheKey(agentId);
        return this.parseLock(await this.cache.get(cacheKey));
    }
    async getAgentWriteLocks(agentIds) {
        const locks = new Map();
        if (agentIds.length === 0)
            return locks;
        const values = await this.cache.getMany(agentIds.map((agentId) => this.formAgentWriteLockCacheKey(agentId)));
        agentIds.forEach((agentId, index) => {
            const lock = this.parseLock(values[index]);
            if (lock)
                locks.set(agentId, lock);
        });
        return locks;
    }
    async releaseAgentWriteLock(agentId) {
        const cacheKey = this.formAgentWriteLockCacheKey(agentId);
        await this.cache.delete(cacheKey);
    }
    async releaseAgentWriteLockIfHolder(agentId, clientId) {
        const cacheKey = this.formAgentWriteLockCacheKey(agentId);
        return await this.serializeLockOp(cacheKey, async () => {
            const current = await this.getAgentWriteLock(agentId);
            if (current?.clientId !== clientId)
                return false;
            await this.cache.delete(cacheKey);
            return true;
        });
    }
    formAgentWriteLockCacheKey(agentId) {
        return `collaboration:write-lock:agent:${agentId}`;
    }
    async acquireAgentWriteLockForce(agentId, clientId, userId) {
        const cacheKey = this.formAgentWriteLockCacheKey(agentId);
        return await this.serializeLockOp(cacheKey, async () => {
            const currentLock = await this.getAgentWriteLock(agentId);
            if (currentLock && currentLock.userId !== userId)
                return false;
            await this.setAgentWriteLock(agentId, clientId, userId);
            return true;
        });
    }
};
exports.CollaborationState = CollaborationState;
exports.CollaborationState = CollaborationState = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.CacheService])
], CollaborationState);
//# sourceMappingURL=collaboration.state.js.map