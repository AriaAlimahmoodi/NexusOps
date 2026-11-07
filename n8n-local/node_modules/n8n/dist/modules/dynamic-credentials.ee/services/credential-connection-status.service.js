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
exports.CredentialConnectionStatusService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const account_identifier_1 = require("../../../oauth/account-identifier");
const backend_services_1 = require("@n8n/backend-services");
const constants_1 = require("../constants");
const dynamic_credential_user_entry_1 = require("../database/entities/dynamic-credential-user-entry");
const dynamic_credential_user_entry_repository_1 = require("../database/repositories/dynamic-credential-user-entry.repository");
const CREDENTIAL_RETAIN_SCOPE = 'credential:connect';
const keyOf = (pair) => `${pair.credentialId}|${pair.userId}`;
let CredentialConnectionStatusService = class CredentialConnectionStatusService {
    constructor(repository, userRepository, sharedCredentialsRepository, roleService, projectRelationRepository, cipher, logger, roleRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.sharedCredentialsRepository = sharedCredentialsRepository;
        this.roleService = roleService;
        this.projectRelationRepository = projectRelationRepository;
        this.cipher = cipher;
        this.logger = logger;
        this.roleRepository = roleRepository;
    }
    async findMyConnections(userId, credentialIds) {
        if (credentialIds.length === 0)
            return new Map();
        const rows = await this.repository.find({
            select: ['credentialId', 'data'],
            where: {
                userId,
                resolverId: constants_1.SYSTEM_RESOLVER_ID,
                credentialId: (0, db_1.In)(credentialIds),
            },
        });
        return new Map(await Promise.all(rows.map(async (row) => [
            row.credentialId,
            { accountIdentifier: await this.readAccountIdentifier(row) },
        ])));
    }
    async readAccountIdentifier(row) {
        let stored;
        try {
            stored = (0, n8n_workflow_1.jsonParse)(await this.cipher.decryptV2(row.data));
        }
        catch (error) {
            this.logger.warn('Could not read the stored data of a per-user credential connection', {
                credentialId: row.credentialId,
                error,
            });
            return undefined;
        }
        return (0, account_identifier_1.extractAccountIdentifierFromData)(stored);
    }
    async deleteMyConnection(userId, credentialId) {
        const result = await this.repository.delete({
            userId,
            credentialId,
            resolverId: constants_1.SYSTEM_RESOLVER_ID,
        });
        return result.affected ?? 0;
    }
    async countConnectedUsers(credentialId) {
        return await this.repository.countBy({ credentialId });
    }
    async deleteAllUserEntries(credentialId, em) {
        const manager = em ?? this.repository.manager;
        await manager.delete(dynamic_credential_user_entry_1.DynamicCredentialUserEntry, { credentialId });
    }
    async cleanupOrphanedEntriesForUsers(userIds, em, credentialId) {
        if (userIds.length === 0)
            return;
        const manager = em ?? this.repository.manager;
        const entries = await manager.find(dynamic_credential_user_entry_1.DynamicCredentialUserEntry, {
            select: ['credentialId', 'userId'],
            where: { userId: (0, db_1.In)(userIds), ...(credentialId ? { credentialId } : {}) },
        });
        if (entries.length === 0)
            return;
        const pairs = entries.map((e) => ({ credentialId: e.credentialId, userId: e.userId }));
        await this.deleteOrphanedPairs(pairs, manager);
    }
    async cleanupOrphanedEntriesForProjects(credentialId, projectIds, em) {
        if (projectIds.length === 0)
            return;
        const manager = em ?? this.repository.manager;
        const members = await manager.findBy(this.projectRelationRepository.target, {
            projectId: (0, db_1.In)(projectIds),
        });
        const userIds = [...new Set(members.map((m) => m.userId))];
        await this.cleanupOrphanedEntriesForUsers(userIds, em, credentialId);
    }
    async deleteOrphanedPairs(pairs, em) {
        if (pairs.length === 0)
            return;
        const uniquePairs = [...new Map(pairs.map((p) => [keyOf(p), p])).values()];
        const users = await em.find(this.userRepository.target, {
            where: { id: (0, db_1.In)(uniquePairs.map((p) => p.userId)) },
            relations: { role: { scopes: true } },
        });
        const userById = new Map(users.map((u) => [u.id, u]));
        const pairsToCheck = uniquePairs.filter((p) => userById.has(p.userId));
        let projectRetainedKeys = new Set();
        let globallyConnectableCredentialIds = new Set();
        if (pairsToCheck.length > 0) {
            const credentialIds = [...new Set(pairsToCheck.map((p) => p.credentialId))];
            const [projectRetained, globallyConnectableCredentials] = await Promise.all([
                (async () => {
                    const validCredRoles = await this.roleService.rolesWithScope('credential', CREDENTIAL_RETAIN_SCOPE, async () => await this.roleRepository.findAll(em));
                    return await this.sharedCredentialsRepository.findPairsWithCredentialAccess(pairsToCheck, CREDENTIAL_RETAIN_SCOPE, validCredRoles, em);
                })(),
                em.find(db_1.CredentialsEntity, {
                    where: {
                        id: (0, db_1.In)(credentialIds),
                        isGlobal: true,
                        usageScope: 'project',
                        isResolvable: true,
                    },
                    select: ['id'],
                }),
            ]);
            projectRetainedKeys = new Set(projectRetained.map(keyOf));
            globallyConnectableCredentialIds = new Set(globallyConnectableCredentials.map((c) => c.id));
        }
        const toDelete = this.selectOrphanedPairs(uniquePairs, userById, projectRetainedKeys, globallyConnectableCredentialIds);
        if (toDelete.length > 0) {
            await this.repository.deleteByPairs(toDelete, em);
        }
    }
    selectOrphanedPairs(pairs, userById, projectRetainedKeys, globallyConnectableCredentialIds) {
        return pairs.filter((pair) => {
            const user = userById.get(pair.userId);
            if (!user)
                return true;
            if ((0, permissions_1.hasGlobalScope)(user, CREDENTIAL_RETAIN_SCOPE))
                return false;
            if (globallyConnectableCredentialIds.has(pair.credentialId))
                return false;
            return !projectRetainedKeys.has(keyOf(pair));
        });
    }
};
exports.CredentialConnectionStatusService = CredentialConnectionStatusService;
exports.CredentialConnectionStatusService = CredentialConnectionStatusService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [dynamic_credential_user_entry_repository_1.DynamicCredentialUserEntryRepository, db_1.UserRepository, db_1.SharedCredentialsRepository, backend_services_1.RoleService, db_1.ProjectRelationRepository, n8n_core_1.Cipher, backend_common_1.Logger, db_1.RoleRepository])
], CredentialConnectionStatusService);
//# sourceMappingURL=credential-connection-status.service.js.map