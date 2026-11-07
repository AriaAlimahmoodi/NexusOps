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
exports.ChatStreamStateService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const backend_services_1 = require("@n8n/backend-services");
let ChatStreamStateService = class ChatStreamStateService {
    constructor(logger, instanceSettings, executionsConfig, globalConfig, chatHubConfig, redisClientService) {
        this.logger = logger;
        this.instanceSettings = instanceSettings;
        this.executionsConfig = executionsConfig;
        this.globalConfig = globalConfig;
        this.chatHubConfig = chatHubConfig;
        this.redisClientService = redisClientService;
        this.memoryStore = new Map();
        this.chunkBuffer = new Map();
        this.cleanupTimers = new Map();
        this.redisClient = null;
        this.logger = this.logger.scoped('chat-hub');
        this.useRedis = this.instanceSettings.isMultiMain || this.executionsConfig.mode === 'queue';
        this.redisPrefix = `${this.globalConfig.redis.prefix}:chat-hub:stream:`;
        this.cleanupDelayMs = this.chatHubConfig.streamStateTtl * constants_1.Time.seconds.toMilliseconds;
        if (this.useRedis) {
            this.redisClient = this.redisClientService.createClient({ type: 'subscriber(n8n)' });
        }
    }
    async startExecution(params) {
        const { sessionId, userId } = params;
        const state = {
            sessionId,
            messageId: '',
            userId,
            sequenceNumber: 0,
            startedAt: Date.now(),
        };
        if (this.useRedis) {
            await this.setRedisState(sessionId, state);
            await this.setRedisChunks(sessionId, []);
        }
        else {
            this.memoryStore.set(sessionId, state);
            this.chunkBuffer.set(sessionId, []);
            this.scheduleCleanup(sessionId);
        }
        this.logger.debug(`Started execution for session ${sessionId}`);
    }
    async endExecution(sessionId) {
        if (this.useRedis) {
            await this.deleteRedisState(sessionId);
            await this.deleteRedisChunks(sessionId);
        }
        else {
            this.memoryStore.delete(sessionId);
            this.chunkBuffer.delete(sessionId);
            this.cancelCleanup(sessionId);
        }
        this.logger.debug(`Ended execution for session ${sessionId}`);
    }
    async setCurrentMessage(sessionId, messageId) {
        if (this.useRedis) {
            const state = await this.getRedisState(sessionId);
            if (state) {
                state.messageId = messageId;
                await this.setRedisState(sessionId, state);
            }
        }
        else {
            const state = this.memoryStore.get(sessionId);
            if (state) {
                state.messageId = messageId;
            }
        }
        this.logger.debug(`Set current message for session ${sessionId} to ${messageId}`);
    }
    async startStream(params) {
        const { sessionId, messageId, userId } = params;
        const state = {
            sessionId,
            messageId,
            userId,
            sequenceNumber: 0,
            startedAt: Date.now(),
        };
        if (this.useRedis) {
            await this.setRedisState(sessionId, state);
            await this.setRedisChunks(sessionId, []);
        }
        else {
            this.memoryStore.set(sessionId, state);
            this.chunkBuffer.set(sessionId, []);
            this.scheduleCleanup(sessionId);
        }
        this.logger.debug(`Started stream for session ${sessionId} message ${messageId}`);
    }
    async getStreamState(sessionId) {
        if (this.useRedis) {
            return await this.getRedisState(sessionId);
        }
        return this.memoryStore.get(sessionId) ?? null;
    }
    async incrementSequence(sessionId) {
        if (this.useRedis) {
            const state = await this.getRedisState(sessionId);
            if (!state)
                return 0;
            state.sequenceNumber += 1;
            await this.setRedisState(sessionId, state);
            return state.sequenceNumber;
        }
        const state = this.memoryStore.get(sessionId);
        if (!state)
            return 0;
        state.sequenceNumber += 1;
        return state.sequenceNumber;
    }
    async bufferChunk(sessionId, chunk) {
        if (this.useRedis) {
            const chunks = await this.getRedisChunks(sessionId);
            chunks.push(chunk);
            while (chunks.length > this.chatHubConfig.maxBufferedChunks) {
                chunks.shift();
            }
            await this.setRedisChunks(sessionId, chunks);
        }
        else {
            let chunks = this.chunkBuffer.get(sessionId);
            if (!chunks) {
                chunks = [];
                this.chunkBuffer.set(sessionId, chunks);
            }
            chunks.push(chunk);
            while (chunks.length > this.chatHubConfig.maxBufferedChunks) {
                chunks.shift();
            }
        }
    }
    async getChunksAfter(sessionId, lastReceivedSequence) {
        let chunks;
        if (this.useRedis) {
            chunks = await this.getRedisChunks(sessionId);
        }
        else {
            chunks = this.chunkBuffer.get(sessionId) ?? [];
        }
        return chunks.filter((chunk) => chunk.sequenceNumber > lastReceivedSequence);
    }
    async endStream(sessionId) {
        if (this.useRedis) {
            await this.deleteRedisState(sessionId);
            await this.deleteRedisChunks(sessionId);
        }
        else {
            this.memoryStore.delete(sessionId);
            this.chunkBuffer.delete(sessionId);
            this.cancelCleanup(sessionId);
        }
        this.logger.debug(`Ended stream for session ${sessionId}`);
    }
    shutdown() {
        for (const timer of this.cleanupTimers.values()) {
            clearTimeout(timer);
        }
        this.cleanupTimers.clear();
        this.memoryStore.clear();
        this.chunkBuffer.clear();
        if (this.redisClient) {
            this.redisClient.disconnect();
        }
    }
    getStateKey(sessionId) {
        return `${this.redisPrefix}state:${sessionId}`;
    }
    getChunksKey(sessionId) {
        return `${this.redisPrefix}chunks:${sessionId}`;
    }
    async getRedisState(sessionId) {
        if (!this.redisClient)
            return null;
        try {
            const data = await this.redisClient.get(this.getStateKey(sessionId));
            if (!data)
                return null;
            return JSON.parse(data);
        }
        catch (error) {
            this.logger.warn(`Failed to get Redis state for session ${sessionId}`, { error });
            return null;
        }
    }
    async setRedisState(sessionId, state) {
        if (!this.redisClient)
            return;
        try {
            await this.redisClient.set(this.getStateKey(sessionId), JSON.stringify(state), 'EX', this.chatHubConfig.streamStateTtl);
        }
        catch (error) {
            this.logger.error(`Failed to set Redis state for session ${sessionId}`, { error });
        }
    }
    async deleteRedisState(sessionId) {
        if (!this.redisClient)
            return;
        try {
            await this.redisClient.del(this.getStateKey(sessionId));
        }
        catch (error) {
            this.logger.error(`Failed to delete Redis state for session ${sessionId}`, { error });
        }
    }
    async getRedisChunks(sessionId) {
        if (!this.redisClient)
            return [];
        try {
            const data = await this.redisClient.get(this.getChunksKey(sessionId));
            if (!data)
                return [];
            return JSON.parse(data);
        }
        catch (error) {
            this.logger.error(`Failed to get Redis chunks for session ${sessionId}`, { error });
            return [];
        }
    }
    async setRedisChunks(sessionId, chunks) {
        if (!this.redisClient)
            return;
        try {
            await this.redisClient.set(this.getChunksKey(sessionId), JSON.stringify(chunks), 'EX', this.chatHubConfig.streamStateTtl);
        }
        catch (error) {
            this.logger.error(`Failed to set Redis chunks for session ${sessionId}`, { error });
        }
    }
    async deleteRedisChunks(sessionId) {
        if (!this.redisClient)
            return;
        try {
            await this.redisClient.del(this.getChunksKey(sessionId));
        }
        catch (error) {
            this.logger.error(`Failed to delete Redis chunks for session ${sessionId}`, { error });
        }
    }
    scheduleCleanup(sessionId) {
        this.cancelCleanup(sessionId);
        const timer = setTimeout(() => {
            this.memoryStore.delete(sessionId);
            this.chunkBuffer.delete(sessionId);
            this.cleanupTimers.delete(sessionId);
            this.logger.debug(`Cleaned up expired stream for session ${sessionId}`);
        }, this.cleanupDelayMs);
        this.cleanupTimers.set(sessionId, timer);
    }
    cancelCleanup(sessionId) {
        const timer = this.cleanupTimers.get(sessionId);
        if (timer) {
            clearTimeout(timer);
            this.cleanupTimers.delete(sessionId);
        }
    }
};
exports.ChatStreamStateService = ChatStreamStateService;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ChatStreamStateService.prototype, "shutdown", null);
exports.ChatStreamStateService = ChatStreamStateService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.InstanceSettings, config_1.ExecutionsConfig, config_1.GlobalConfig, config_1.ChatHubConfig, backend_services_1.RedisClientService])
], ChatStreamStateService);
//# sourceMappingURL=chat-stream-state.service.js.map