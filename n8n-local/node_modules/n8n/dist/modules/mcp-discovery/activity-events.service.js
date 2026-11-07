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
exports.McpDiscoveryActivityEvents = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const di_1 = require("@n8n/di");
const activity_service_1 = require("./activity.service");
let McpDiscoveryActivityEvents = class McpDiscoveryActivityEvents {
    constructor(events, activity, logger) {
        this.events = events;
        this.activity = activity;
        this.logger = logger;
        this.pending = new Map();
        this.initialized = false;
    }
    init() {
        if (this.initialized)
            return;
        this.initialized = true;
        this.on('experiment-user-first-login', async ({ userId, at }) => await this.activity.recordFirstLogin(userId, at));
        this.on('experiment-assistant-change-saved', async ({ userId, at }) => await this.activity.recordAssistantMutation(userId, at));
        this.on('experiment-mcp-client-connected', async ({ userId, clientName, caller }) => await this.activity.recordClaudeConnection(userId, clientName, caller));
        this.on('experiment-mcp-workflow-write-completed', async (event) => {
            const content = event.structuredContent;
            const operations = typeof content === 'object' &&
                content !== null &&
                'appliedOperations' in content &&
                typeof content.appliedOperations === 'number'
                ? content.appliedOperations
                : undefined;
            return await this.activity.recordMcpToolResult(event.userId, event.toolName, event.status, event.workflowId, operations);
        });
    }
    async flush(userId) {
        while (this.pending.has(userId))
            await this.pending.get(userId);
    }
    on(name, handler) {
        this.events.on(name, (event) => {
            const previous = this.pending.get(event.userId);
            const write = previous ? previous.then(async () => await handler(event)) : handler(event);
            const pending = write.catch((error) => {
                this.logger.warn('Failed to record MCP discovery activity', { error });
            });
            this.pending.set(event.userId, pending);
            void pending.finally(() => {
                if (this.pending.get(event.userId) === pending)
                    this.pending.delete(event.userId);
            });
        });
    }
};
exports.McpDiscoveryActivityEvents = McpDiscoveryActivityEvents;
exports.McpDiscoveryActivityEvents = McpDiscoveryActivityEvents = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.EventService, activity_service_1.McpDiscoveryActivityService, backend_common_1.Logger])
], McpDiscoveryActivityEvents);
//# sourceMappingURL=activity-events.service.js.map