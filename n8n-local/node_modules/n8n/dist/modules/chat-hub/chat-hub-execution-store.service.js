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
exports.ChatHubExecutionStore = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const backend_services_1 = require("@n8n/backend-services");
let ChatHubExecutionStore = class ChatHubExecutionStore {
    constructor(logger, instanceSettings, executionsConfig, globalConfig, chatHubConfig, redisClientService) {
        this.logger = logger;
        this.instanceSettings = instanceSettings;
        this.executionsConfig = executionsConfig;
        this.globalConfig = globalConfig;
        this.chatHubConfig = chatHubConfig;
        this.redisClientService = redisClientService;
        this.memoryStore = new Map();
        this.cleanupTimers = new Map();
        this.redisClient = null;
        this.logger = this.logger.scoped('chat-hub');
        this.useRedis = this.instanceSettings.isMultiMain || this.executionsConfig.mode === 'queue';
        this.redisPrefix = `${this.globalConfig.redis.prefix}:chat-hub:exec:`;
        this.cleanupDelayMs = this.chatHubConfig.executionContextTtl * constants_1.Time.seconds.toMilliseconds;
        if (this.useRedis) {
            this.redisClient = this.redisClientService.createClient({ type: 'subscriber(n8n)' });
        }
    }
    async register(context) {
        const { executionId } = context;
        if (this.useRedis) {
            await this.setRedisContext(executionId, context);
        }
        else {
            this.memoryStore.set(executionId, context);
            this.scheduleCleanup(executionId);
        }
    }
    async get(executionId) {
        if (this.useRedis) {
            return await this.getRedisContext(executionId);
        }
        return this.memoryStore.get(executionId) ?? null;
    }
    async update(executionId, updates) {
        const context = await this.get(executionId);
        if (!context) {
            this.logger.warn(`Attempted to update non-existent execution context: ${executionId}`);
            return;
        }
        const updatedContext = { ...context, ...updates };
        if (this.useRedis) {
            await this.setRedisContext(executionId, updatedContext);
        }
        else {
            this.memoryStore.set(executionId, updatedContext);
            this.scheduleCleanup(executionId);
        }
    }
    async remove(executionId) {
        if (this.useRedis) {
            await this.deleteRedisContext(executionId);
        }
        else {
            this.memoryStore.delete(executionId);
            this.cancelCleanup(executionId);
        }
    }
    shutdown() {
        for (const timer of this.cleanupTimers.values()) {
            clearTimeout(timer);
        }
        this.cleanupTimers.clear();
        this.memoryStore.clear();
        if (this.redisClient) {
            this.redisClient.disconnect();
        }
    }
    getContextKey(executionId) {
        return `${this.redisPrefix}${executionId}`;
    }
    async getRedisContext(executionId) {
        if (!this.redisClient)
            return null;
        try {
            const data = await this.redisClient.get(this.getContextKey(executionId));
            if (!data)
                return null;
            return JSON.parse(data);
        }
        catch (error) {
            this.logger.error(`Failed to get Redis context for execution ${executionId}`, { error });
            return null;
        }
    }
    async setRedisContext(executionId, context) {
        if (!this.redisClient)
            return;
        try {
            await this.redisClient.set(this.getContextKey(executionId), JSON.stringify(context), 'EX', this.chatHubConfig.executionContextTtl);
        }
        catch (error) {
            this.logger.error(`Failed to set Redis context for execution ${executionId}`, { error });
        }
    }
    async deleteRedisContext(executionId) {
        if (!this.redisClient)
            return;
        try {
            await this.redisClient.del(this.getContextKey(executionId));
        }
        catch (error) {
            this.logger.error(`Failed to delete Redis context for execution ${executionId}`, { error });
        }
    }
    scheduleCleanup(executionId) {
        this.cancelCleanup(executionId);
        const timer = setTimeout(() => {
            this.memoryStore.delete(executionId);
            this.cleanupTimers.delete(executionId);
            this.logger.debug(`Cleaned up expired execution context for ${executionId}`);
        }, this.cleanupDelayMs);
        this.cleanupTimers.set(executionId, timer);
    }
    cancelCleanup(executionId) {
        const timer = this.cleanupTimers.get(executionId);
        if (timer) {
            clearTimeout(timer);
            this.cleanupTimers.delete(executionId);
        }
    }
};
exports.ChatHubExecutionStore = ChatHubExecutionStore;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ChatHubExecutionStore.prototype, "shutdown", null);
exports.ChatHubExecutionStore = ChatHubExecutionStore = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.InstanceSettings, config_1.ExecutionsConfig, config_1.GlobalConfig, config_1.ChatHubConfig, backend_services_1.RedisClientService])
], ChatHubExecutionStore);
//# sourceMappingURL=chat-hub-execution-store.service.js.map