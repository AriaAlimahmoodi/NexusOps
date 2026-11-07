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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscriber = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const debounce_1 = __importDefault(require("lodash/debounce"));
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const backend_services_1 = require("@n8n/backend-services");
const pubsub_eventbus_1 = require("./pubsub.eventbus");
const constants_1 = require("../constants");
let Subscriber = class Subscriber {
    constructor(logger, instanceSettings, pubsubEventBus, redisClientService, executionsConfig, globalConfig) {
        this.logger = logger;
        this.instanceSettings = instanceSettings;
        this.pubsubEventBus = pubsubEventBus;
        this.redisClientService = redisClientService;
        this.executionsConfig = executionsConfig;
        this.globalConfig = globalConfig;
        this.debouncedHandlers = new Map();
        this.channels = new Set();
        this.lostConnection = false;
        if (this.executionsConfig.mode !== 'queue')
            return;
        this.logger = this.logger.scoped(['scaling', 'pubsub']);
        const prefix = this.globalConfig.redis.prefix;
        this.commandChannel = `${prefix}:${constants_1.COMMAND_PUBSUB_CHANNEL}`;
        this.workerResponseChannel = `${prefix}:${constants_1.WORKER_RESPONSE_PUBSUB_CHANNEL}`;
        this.mcpRelayChannel = `${prefix}:${constants_1.MCP_RELAY_PUBSUB_CHANNEL}`;
        this.client = this.redisClientService.createClient({ type: 'subscriber(n8n)' });
        this.client.on('close', () => {
            this.lostConnection = true;
        });
        this.client.on('ready', () => {
            if (!this.lostConnection)
                return;
            this.lostConnection = false;
            void this.resubscribe();
        });
        this.livenessTimer = setInterval(async () => {
            await this.checkLiveness();
        }, constants_1.SUBSCRIBER_LIVENESS_INTERVAL_MS).unref();
        const handlerFn = (msg) => {
            this.pubsubEventBus.emit(this.eventNameFrom(msg), msg.payload);
        };
        this.client.on('message', (channel, str) => {
            if (channel === this.mcpRelayChannel) {
                this.handleMcpRelayMessage(str);
                return;
            }
            const msg = this.parseMessage(str, channel);
            if (!msg)
                return;
            if (!msg.debounce)
                return handlerFn(msg);
            const debounceKey = this.debounceKeyFrom(msg);
            let handler = this.debouncedHandlers.get(debounceKey);
            if (!handler) {
                const debouncedHandler = (0, debounce_1.default)((message) => {
                    try {
                        handlerFn(message);
                    }
                    finally {
                        if (this.debouncedHandlers.get(debounceKey) === debouncedHandler) {
                            this.debouncedHandlers.delete(debounceKey);
                        }
                    }
                }, 300);
                handler = debouncedHandler;
                this.debouncedHandlers.set(debounceKey, handler);
            }
            handler(msg);
        });
    }
    setMcpRelayHandler(handler) {
        this.mcpRelayHandler = handler;
    }
    handleMcpRelayMessage(str) {
        const msg = (0, n8n_workflow_1.jsonParse)(str, { fallbackValue: null });
        if (!msg?.sessionId || !msg.messageId) {
            this.logger.error('Received malformed MCP relay message', { msg: str });
            return;
        }
        this.logger.debug('Received MCP relay message', {
            sessionId: msg.sessionId,
            messageId: msg.messageId,
        });
        if (this.mcpRelayHandler) {
            this.mcpRelayHandler(msg);
        }
    }
    getClient() {
        return this.client;
    }
    getCommandChannel() {
        return this.commandChannel;
    }
    getWorkerResponseChannel() {
        return this.workerResponseChannel;
    }
    getMcpRelayChannel() {
        return this.mcpRelayChannel;
    }
    shutdown() {
        clearInterval(this.livenessTimer);
        for (const handler of this.debouncedHandlers.values())
            handler.cancel();
        this.client.disconnect();
    }
    async subscribe(channel) {
        this.channels.add(channel);
        await this.client.subscribe(channel, (error) => {
            if (error) {
                this.logger.error(`Failed to subscribe to channel ${channel}`, { error });
                return;
            }
            this.logger.debug(`Subscribed to channel ${channel}`);
        });
    }
    async resubscribe() {
        if (this.channels.size === 0)
            return;
        try {
            for (const channel of this.channels)
                await this.subscribe(channel);
            this.logger.info('Resubscribed to pubsub channels after Redis reconnect', {
                channels: [...this.channels],
            });
        }
        catch (error) {
            this.lostConnection = true;
            this.logger.error('Failed to resubscribe to pubsub channels after Redis reconnect', {
                error,
            });
            return;
        }
        this.pubsubEventBus.emit('pubsub-reconnected');
    }
    async checkLiveness() {
        if (this.channels.size === 0)
            return;
        const timeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('timeout')), constants_1.SUBSCRIBER_LIVENESS_TIMEOUT_MS).unref();
        });
        try {
            await Promise.race([this.client.subscribe(...this.channels), timeout]);
        }
        catch (error) {
            this.logger.warn('Pubsub subscriber connection is unresponsive, reconnecting', { error });
            this.client.disconnect(true);
        }
    }
    eventNameFrom(msg) {
        return 'command' in msg ? msg.command : msg.response;
    }
    debounceKeyFrom(msg) {
        const eventName = this.eventNameFrom(msg);
        if ('command' in msg &&
            (msg.command === 'community-package-install' ||
                msg.command === 'community-package-update' ||
                msg.command === 'community-package-uninstall')) {
            return `${eventName}:${msg.payload.packageName}`;
        }
        return eventName;
    }
    parseMessage(str, channel) {
        const msg = (0, n8n_workflow_1.jsonParse)(str, {
            fallbackValue: null,
        });
        if (!msg) {
            this.logger.error('Received malformed pubsub message', {
                msg: str,
                channel,
            });
            return null;
        }
        const { hostId } = this.instanceSettings;
        if ('command' in msg &&
            !msg.selfSend &&
            (msg.senderId === hostId || (msg.targets && !msg.targets.includes(hostId)))) {
            return null;
        }
        let msgName = this.eventNameFrom(msg);
        const metadata = { msg: msgName, channel };
        if ('command' in msg && msg.command === 'relay-execution-lifecycle-event') {
            const { data, type } = msg.payload;
            msgName += ` (${type})`;
            metadata.type = type;
            if ('executionId' in data)
                metadata.executionId = data.executionId;
        }
        this.logger.debug(`Received pubsub msg: ${msgName}`, metadata);
        return msg;
    }
};
exports.Subscriber = Subscriber;
exports.Subscriber = Subscriber = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.InstanceSettings, pubsub_eventbus_1.PubSubEventBus, backend_services_1.RedisClientService, config_1.ExecutionsConfig, config_1.GlobalConfig])
], Subscriber);
//# sourceMappingURL=subscriber.service.js.map