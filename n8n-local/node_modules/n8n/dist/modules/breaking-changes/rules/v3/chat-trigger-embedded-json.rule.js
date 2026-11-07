"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatTriggerEmbeddedJsonRule = void 0;
const decorators_1 = require("@n8n/decorators");
const detection_report_1 = require("../../detection-report");
const CHAT_TRIGGER_NODE_TYPES = [
    '@n8n/n8n-nodes-langchain.chatTrigger',
    'n8n-nodes-langchain.chatTrigger',
];
const EMBEDDED_MODE = 'webhook';
let ChatTriggerEmbeddedJsonRule = class ChatTriggerEmbeddedJsonRule {
    constructor() {
        this.id = 'chat-trigger-embedded-json-v3';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: 'Embedded chat now uses a JSON WebSocket message format',
            description: 'The chat WebSocket now sends every frame as JSON. Embedded chats using an old @n8n/chat widget pinned to a specific version, or a custom chat client that reads the raw WebSocket, will not understand the new frames until updated. Chats embedded via the unpinned CDN script update automatically, and hosted chats served by n8n are unaffected.',
            category: "workflow",
            impact: 'executionsFail',
            documentationUrl: 'https://www.npmjs.com/package/@n8n/chat',
        };
    }
    async getRecommendations(_workflowResults) {
        return [
            {
                action: 'Update your embedded chat to support the JSON message format',
                description: 'If you embed the @n8n/chat widget with a pinned version, update it to a version that supports the JSON WebSocket format. If you use a custom chat client, make sure it parses JSON frames. Embeds using the unpinned CDN script update automatically and need no action.',
            },
        ];
    }
    async detectWorkflow(_workflow, nodesGroupedByType) {
        const affectedNodes = CHAT_TRIGGER_NODE_TYPES.flatMap((type) => nodesGroupedByType.get(type) ?? []).filter((node) => node.parameters.mode === EMBEDDED_MODE);
        return (0, detection_report_1.reportAffectedNodes)(affectedNodes, (node) => ({
            title: `Node '${node.name}' uses an embedded chat`,
            description: 'This embedded chat now receives JSON WebSocket frames. Update a pinned @n8n/chat widget to a version that supports the JSON format, or ensure your custom chat client parses JSON frames. Unpinned CDN embeds update automatically.',
            level: 'warning',
        }));
    }
};
exports.ChatTriggerEmbeddedJsonRule = ChatTriggerEmbeddedJsonRule;
exports.ChatTriggerEmbeddedJsonRule = ChatTriggerEmbeddedJsonRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' })
], ChatTriggerEmbeddedJsonRule);
//# sourceMappingURL=chat-trigger-embedded-json.rule.js.map