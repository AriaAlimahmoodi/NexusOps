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
exports.CollaborationService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const collaboration_message_1 = require("./collaboration.message");
const collaboration_state_1 = require("../collaboration/collaboration.state");
const errors_1 = require("@n8n/errors");
const agent_repository_1 = require("../modules/agents/repositories/agent.repository");
const push_1 = require("../push");
const check_access_1 = require("../permissions.ee/check-access");
const access_service_1 = require("../services/access.service");
const OPEN_WORKFLOW_CHECK_BATCH_SIZE = 100;
let CollaborationService = class CollaborationService {
    constructor(logger, errorReporter, push, state, userRepository, accessService, agentRepository) {
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.push = push;
        this.state = state;
        this.userRepository = userRepository;
        this.accessService = accessService;
        this.agentRepository = agentRepository;
    }
    init() {
        this.push.on('message', async (event) => {
            try {
                await this.handleUserMessage(event.userId, event.pushRef, event.msg);
            }
            catch (error) {
                if (this.isTransientError(error)) {
                    this.logger.debug('Transient infrastructure error in collaboration service', {
                        error,
                    });
                    return;
                }
                this.errorReporter.error(new n8n_workflow_1.UnexpectedError('Error handling CollaborationService push message', {
                    extra: {
                        msg: event.msg,
                        userId: event.userId,
                        pushRef: event.pushRef,
                    },
                    cause: error,
                }));
            }
        });
    }
    isTransientError(error) {
        return (error instanceof Error &&
            'code' in error &&
            typeof error.code === 'string' &&
            ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'].includes(error.code));
    }
    async handleUserMessage(userId, clientId, msg) {
        const workflowMessage = await (0, collaboration_message_1.parseWorkflowMessage)(msg);
        if (workflowMessage.type === 'workflowOpened') {
            await this.handleWorkflowOpened(userId, clientId, workflowMessage);
        }
        else if (workflowMessage.type === 'workflowClosed') {
            await this.handleWorkflowClosed(userId, clientId, workflowMessage);
        }
        else if (workflowMessage.type === 'writeAccessRequested') {
            await this.handleWriteAccessRequested(userId, clientId, workflowMessage);
        }
        else if (workflowMessage.type === 'writeAccessReleaseRequested') {
            await this.handleWriteAccessReleaseRequested(userId, clientId, workflowMessage);
        }
        else if (workflowMessage.type === 'writeAccessHeartbeat') {
            await this.handleWriteAccessHeartbeat(userId, clientId, workflowMessage);
        }
        else if (workflowMessage.type === 'agentOpened') {
            await this.handleAgentOpened(userId, clientId, workflowMessage);
        }
        else if (workflowMessage.type === 'agentClosed') {
            await this.handleAgentClosed(userId, clientId, workflowMessage);
        }
        else if (workflowMessage.type === 'agentWriteAccessRequested') {
            await this.handleAgentWriteAccessRequested(userId, clientId, workflowMessage);
        }
        else if (workflowMessage.type === 'agentWriteAccessReleaseRequested') {
            await this.handleAgentWriteAccessReleaseRequested(userId, clientId, workflowMessage);
        }
        else if (workflowMessage.type === 'agentWriteAccessHeartbeat') {
            await this.handleAgentWriteAccessHeartbeat(userId, clientId, workflowMessage);
        }
    }
    async handleWorkflowOpened(userId, clientId, msg) {
        const { workflowId } = msg;
        if (!(await this.accessService.hasReadAccess(userId, workflowId))) {
            return;
        }
        await this.state.addCollaborator(workflowId, userId, clientId);
        await this.sendWorkflowUsersChangedMessage(workflowId);
    }
    async handleWorkflowClosed(userId, clientId, msg) {
        const { workflowId } = msg;
        if (!(await this.accessService.hasReadAccess(userId, workflowId))) {
            return;
        }
        const released = await this.state.releaseWriteLockIfHolder(workflowId, clientId);
        if (released) {
            await this.sendWriteAccessReleasedMessage(workflowId);
        }
        await this.state.removeCollaborator(workflowId, clientId);
        await this.sendWorkflowUsersChangedMessage(workflowId);
    }
    async sendWorkflowUsersChangedMessage(workflowId) {
        const collaborators = await this.state.getCollaborators(workflowId);
        const userIds = collaborators.map((user) => user.userId);
        if (userIds.length === 0) {
            return;
        }
        const users = await this.userRepository.getByIds(this.userRepository.manager, userIds);
        const activeCollaborators = users.map((user) => ({
            user: user.toIUser(),
            lastSeen: collaborators.find(({ userId }) => userId === user.id).lastSeen,
        }));
        const msgData = {
            workflowId,
            collaborators: activeCollaborators,
        };
        this.push.sendToUsers({ type: 'collaboratorsChanged', data: msgData }, userIds);
    }
    async handleWriteAccessRequested(userId, clientId, msg) {
        const { workflowId, force } = msg;
        if (!(await this.accessService.hasWriteAccess(userId, workflowId))) {
            return;
        }
        if (force) {
            const acquired = await this.state.acquireWriteLockForce(workflowId, clientId, userId);
            if (!acquired) {
                return;
            }
        }
        else {
            const acquired = await this.state.acquireWriteLock(workflowId, clientId, userId);
            if (!acquired) {
                return;
            }
        }
        await this.sendWriteAccessAcquiredMessage(workflowId, userId, clientId);
    }
    async handleWriteAccessReleaseRequested(_userId, clientId, msg) {
        const { workflowId } = msg;
        const released = await this.state.releaseWriteLockIfHolder(workflowId, clientId);
        if (!released) {
            return;
        }
        await this.sendWriteAccessReleasedMessage(workflowId);
    }
    async handleWriteAccessHeartbeat(_userId, clientId, msg) {
        const { workflowId } = msg;
        await this.state.renewWriteLock(workflowId, clientId);
    }
    async sendWriteAccessAcquiredMessage(workflowId, userId, clientId) {
        const collaborators = await this.state.getCollaborators(workflowId);
        const collaboratorUserIds = collaborators.map((user) => user.userId);
        const userIds = [...new Set([...collaboratorUserIds, userId])];
        const msgData = {
            workflowId,
            userId,
            clientId,
        };
        this.push.sendToUsers({ type: 'writeAccessAcquired', data: msgData }, userIds);
    }
    async sendWriteAccessReleasedMessage(workflowId) {
        const collaborators = await this.state.getCollaborators(workflowId);
        const userIds = collaborators.map((user) => user.userId);
        if (userIds.length === 0) {
            return;
        }
        const msgData = {
            workflowId,
        };
        this.push.sendToUsers({ type: 'writeAccessReleased', data: msgData }, userIds);
    }
    async broadcastWorkflowUpdate(workflowId, updatedByUserId) {
        const collaborators = await this.state.getCollaborators(workflowId);
        const userIds = collaborators.map((user) => user.userId);
        if (userIds.length === 0) {
            return;
        }
        const msgData = {
            workflowId,
            userId: updatedByUserId,
        };
        this.push.sendToUsers({ type: 'workflowUpdated', data: msgData }, userIds);
    }
    async filterOpenWorkflowIds(workflowIds) {
        const uniqueWorkflowIds = [...new Set(workflowIds)];
        const openWorkflowIds = [];
        for (let start = 0; start < uniqueWorkflowIds.length; start += OPEN_WORKFLOW_CHECK_BATCH_SIZE) {
            const chunk = uniqueWorkflowIds.slice(start, start + OPEN_WORKFLOW_CHECK_BATCH_SIZE);
            const collaboratorLookups = await Promise.allSettled(chunk.map(async (workflowId) => {
                const collaborators = await this.state.getCollaborators(workflowId);
                return { workflowId, isOpen: collaborators.length > 0 };
            }));
            const failedWorkflowIds = [];
            for (const [index, result] of collaboratorLookups.entries()) {
                if (result.status === 'fulfilled') {
                    if (result.value.isOpen)
                        openWorkflowIds.push(result.value.workflowId);
                }
                else {
                    const workflowId = chunk[index];
                    if (workflowId)
                        failedWorkflowIds.push(workflowId);
                }
            }
            if (failedWorkflowIds.length > 0) {
                this.logger.warn('Failed to resolve collaborators while filtering open workflows', {
                    workflowCount: failedWorkflowIds.length,
                    workflowIds: failedWorkflowIds.slice(0, 10),
                });
            }
        }
        return openWorkflowIds;
    }
    async broadcastWorkflowSettingsUpdated(workflowId, settings, checksum) {
        const collaborators = await this.state.getCollaborators(workflowId);
        const userIds = collaborators.map((user) => user.userId);
        if (userIds.length === 0) {
            return;
        }
        const msgData = {
            workflowId,
            settings,
            ...(checksum !== undefined ? { checksum } : {}),
        };
        this.push.sendToUsers({ type: 'workflowSettingsUpdated', data: msgData }, userIds);
    }
    async broadcastWorkflowReviewStateChanged(workflowId) {
        const collaborators = await this.state.getCollaborators(workflowId);
        const userIds = collaborators.map((user) => user.userId);
        if (userIds.length === 0) {
            return;
        }
        const msgData = {
            workflowId,
        };
        this.push.sendToUsers({ type: 'workflowReviewStateChanged', data: msgData }, userIds);
    }
    async getWriteLock(userId, workflowId) {
        if (!(await this.accessService.hasReadAccess(userId, workflowId))) {
            return null;
        }
        return await this.state.getWriteLock(workflowId);
    }
    async ensureWorkflowEditable(workflowId) {
        const lock = await this.state.getWriteLock(workflowId);
        if (lock) {
            throw new errors_1.LockedError('Cannot modify workflow while it is being edited by a user in the editor.');
        }
    }
    async validateWriteLock(userId, clientId, workflowId, action) {
        if (!clientId) {
            return;
        }
        const lock = await this.state.getWriteLock(workflowId);
        if (!lock) {
            return;
        }
        if (lock.clientId === clientId) {
            if (lock.userId === userId) {
                return;
            }
            throw new errors_1.LockedError(`Cannot ${action} workflow - another user currently has write access`);
        }
        if (lock.userId === userId) {
            throw new errors_1.ConflictError(`Cannot ${action} workflow - you have this workflow open in another tab`);
        }
        else {
            throw new errors_1.LockedError(`Cannot ${action} workflow - another user currently has write access`);
        }
    }
    async hasAgentScope(userId, agentId, scope) {
        const [projectId, user] = await Promise.all([
            this.agentRepository.getProjectIdById(agentId),
            this.userRepository.findOne({ where: { id: userId }, relations: ['role'] }),
        ]);
        if (!projectId || !user)
            return false;
        return await (0, check_access_1.userHasScopes)(user, [scope], false, { projectId });
    }
    async hasAgentReadAccess(userId, agentId) {
        return await this.hasAgentScope(userId, agentId, 'agent:read');
    }
    async hasAgentWriteAccess(userId, agentId) {
        return await this.hasAgentScope(userId, agentId, 'agent:update');
    }
    async handleAgentOpened(userId, clientId, msg) {
        const { agentId } = msg;
        if (!(await this.hasAgentReadAccess(userId, agentId))) {
            return;
        }
        await this.state.addAgentCollaborator(agentId, userId, clientId);
        await this.sendAgentUsersChangedMessage(agentId);
    }
    async handleAgentClosed(userId, clientId, msg) {
        const { agentId } = msg;
        if (!(await this.hasAgentReadAccess(userId, agentId))) {
            return;
        }
        const released = await this.state.releaseAgentWriteLockIfHolder(agentId, clientId);
        if (released) {
            await this.sendAgentWriteAccessReleasedMessage(agentId);
        }
        await this.state.removeAgentCollaborator(agentId, clientId);
        await this.sendAgentUsersChangedMessage(agentId);
    }
    async sendAgentUsersChangedMessage(agentId) {
        const collaborators = await this.state.getAgentCollaborators(agentId);
        const userIds = collaborators.map((user) => user.userId);
        if (userIds.length === 0) {
            return;
        }
        const users = await this.userRepository.getByIds(this.userRepository.manager, userIds);
        const activeCollaborators = users.map((user) => ({
            user: user.toIUser(),
            lastSeen: collaborators.find(({ userId }) => userId === user.id).lastSeen,
        }));
        const msgData = {
            agentId,
            collaborators: activeCollaborators,
        };
        this.push.sendToUsers({ type: 'collaboratorsChanged', data: msgData }, userIds);
    }
    async handleAgentWriteAccessRequested(userId, clientId, msg) {
        const { agentId, force } = msg;
        if (!(await this.hasAgentWriteAccess(userId, agentId))) {
            return;
        }
        if (force) {
            const acquired = await this.state.acquireAgentWriteLockForce(agentId, clientId, userId);
            if (!acquired) {
                return;
            }
        }
        else {
            const acquired = await this.state.acquireAgentWriteLock(agentId, clientId, userId);
            if (!acquired) {
                return;
            }
        }
        await this.sendAgentWriteAccessAcquiredMessage(agentId, userId, clientId);
    }
    async handleAgentWriteAccessReleaseRequested(_userId, clientId, msg) {
        const { agentId } = msg;
        const released = await this.state.releaseAgentWriteLockIfHolder(agentId, clientId);
        if (!released) {
            return;
        }
        await this.sendAgentWriteAccessReleasedMessage(agentId);
    }
    async handleAgentWriteAccessHeartbeat(_userId, clientId, msg) {
        const { agentId } = msg;
        await this.state.renewAgentWriteLock(agentId, clientId);
    }
    async sendAgentWriteAccessAcquiredMessage(agentId, userId, clientId) {
        const collaborators = await this.state.getAgentCollaborators(agentId);
        const collaboratorUserIds = collaborators.map((user) => user.userId);
        const userIds = [...new Set([...collaboratorUserIds, userId])];
        const msgData = {
            agentId,
            userId,
            clientId,
        };
        this.push.sendToUsers({ type: 'writeAccessAcquired', data: msgData }, userIds);
    }
    async sendAgentWriteAccessReleasedMessage(agentId) {
        const collaborators = await this.state.getAgentCollaborators(agentId);
        const userIds = collaborators.map((user) => user.userId);
        if (userIds.length === 0) {
            return;
        }
        const msgData = {
            agentId,
        };
        this.push.sendToUsers({ type: 'writeAccessReleased', data: msgData }, userIds);
    }
    async getAgentWriteLock(projectId, agentId) {
        const exists = await this.agentRepository.existsByIdAndProjectId(agentId, projectId);
        if (!exists) {
            return null;
        }
        return await this.state.getAgentWriteLock(agentId);
    }
    async ensureAgentEditable(agentId) {
        const lock = await this.state.getAgentWriteLock(agentId);
        if (lock) {
            throw new errors_1.LockedError('Cannot modify agent while it is being edited by a user in the builder.');
        }
    }
    async validateAgentWriteLock(userId, clientId, projectId, agentId, action) {
        const exists = await this.agentRepository.existsByIdAndProjectId(agentId, projectId);
        if (!exists) {
            throw new errors_1.NotFoundError('Agent not found');
        }
        if (!clientId) {
            return;
        }
        const lock = await this.state.getAgentWriteLock(agentId);
        if (lock) {
            this.assertAgentLockHeldBy(lock, userId, clientId, action);
        }
    }
    async validateAgentWriteLocks(userId, clientId, agentIds, action) {
        if (!clientId || agentIds.length === 0) {
            return;
        }
        const locks = await this.state.getAgentWriteLocks(agentIds);
        for (const lock of locks.values()) {
            this.assertAgentLockHeldBy(lock, userId, clientId, action);
        }
    }
    assertAgentLockHeldBy(lock, userId, clientId, action) {
        if (lock.clientId === clientId) {
            if (lock.userId === userId) {
                return;
            }
            throw new errors_1.LockedError(`Cannot ${action} agent - another user currently has write access`);
        }
        if (lock.userId === userId) {
            throw new errors_1.ConflictError(`Cannot ${action} agent - you have this agent open in another tab`);
        }
        throw new errors_1.LockedError(`Cannot ${action} agent - another user currently has write access`);
    }
};
exports.CollaborationService = CollaborationService;
exports.CollaborationService = CollaborationService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.ErrorReporter, push_1.Push, collaboration_state_1.CollaborationState, db_1.UserRepository, access_service_1.AccessService, agent_repository_1.AgentRepository])
], CollaborationService);
//# sourceMappingURL=collaboration.service.js.map