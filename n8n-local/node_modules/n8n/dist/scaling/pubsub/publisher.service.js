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
exports.Publisher = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const backend_services_1 = require("@n8n/backend-services");
const constants_1 = require("../constants");
let Publisher = class Publisher {
    constructor(logger, redisClientService, instanceSettings, executionsConfig, globalConfig) {
        this.logger = logger;
        this.redisClientService = redisClientService;
        this.instanceSettings = instanceSettings;
        this.executionsConfig = executionsConfig;
        this.globalConfig = globalConfig;
        if (this.executionsConfig.mode !== 'queue')
            return;
        this.logger = this.logger.scoped(['scaling', 'pubsub']);
        const prefix = this.globalConfig.redis.prefix;
        this.commandChannel = `${prefix}:${constants_1.COMMAND_PUBSUB_CHANNEL}`;
        this.workerResponseChannel = `${prefix}:${constants_1.WORKER_RESPONSE_PUBSUB_CHANNEL}`;
        this.mcpRelayChannel = `${prefix}:${constants_1.MCP_RELAY_PUBSUB_CHANNEL}`;
        this.client = this.redisClientService.createClient({ type: 'publisher(n8n)' });
    }
    getClient() {
        return this.client;
    }
    shutdown() {
        this.client.disconnect();
    }
    async publishCommand(msg) {
        if (this.executionsConfig.mode !== 'queue')
            return;
        await this.client.publish(this.commandChannel, JSON.stringify({
            ...msg,
            senderId: this.instanceSettings.hostId,
            selfSend: constants_1.SELF_SEND_COMMANDS.has(msg.command),
            debounce: !constants_1.IMMEDIATE_COMMANDS.has(msg.command),
        }));
        let msgName = msg.command;
        const metadata = { msg: msg.command, channel: this.commandChannel };
        if (msg.command === 'relay-execution-lifecycle-event') {
            const { data, type } = msg.payload;
            msgName += ` (${type})`;
            metadata.type = type;
            if ('executionId' in data)
                metadata.executionId = data.executionId;
        }
        this.logger.debug(`Published pubsub msg: ${msgName}`, metadata);
    }
    async publishWorkerResponse(msg) {
        await this.client.publish(this.workerResponseChannel, JSON.stringify(msg));
        this.logger.debug(`Published ${msg.response} to worker response channel`);
    }
    async publishMcpRelay(msg) {
        if (this.executionsConfig.mode !== 'queue')
            return;
        await this.client.publish(this.mcpRelayChannel, JSON.stringify(msg));
        this.logger.debug('Published MCP relay message', {
            sessionId: msg.sessionId,
            messageId: msg.messageId,
            channel: this.mcpRelayChannel,
        });
    }
    async setIfNotExists(key, value, ttl) {
        const result = await this.client.set(key, value, 'EX', ttl, 'NX');
        return result === 'OK';
    }
    async set(key, value, ttl) {
        await this.client.set(key, value, 'EX', ttl);
    }
    async setExpiration(key, ttl) {
        await this.client.expire(key, ttl);
    }
    async get(key) {
        return await this.client.get(key);
    }
    async clear(key) {
        await this.client?.del(key);
    }
};
exports.Publisher = Publisher;
exports.Publisher = Publisher = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, backend_services_1.RedisClientService, n8n_core_1.InstanceSettings, config_1.ExecutionsConfig, config_1.GlobalConfig])
], Publisher);
//# sourceMappingURL=publisher.service.js.map