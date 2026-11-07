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
exports.SlackSignatureExtractor = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const zod_1 = require("zod");
function isHeaderObject(obj) {
    return obj !== null && obj !== undefined && typeof obj === 'object' && !Array.isArray(obj);
}
let SlackSignatureExtractor = class SlackSignatureExtractor {
    constructor(logger) {
        this.logger = logger;
        this.hookDescription = {
            name: 'SlackSignatureExtractor',
            displayName: 'Slack Identity Extractor',
            options: [],
        };
    }
    isApplicableToTriggerNode(nodeType) {
        return nodeType === 'n8n-nodes-base.webhook' || nodeType === 'webhook';
    }
    async execute(options) {
        if (!options.triggerItems || options.triggerItems.length === 0) {
            this.logger.error('No trigger items found for Slack identity extraction');
            throw new Error('No trigger items found for Slack identity extraction');
        }
        const [triggerItem] = options.triggerItems;
        const headers = triggerItem.json['headers'];
        if (!isHeaderObject(headers)) {
            this.logger.error('No headers found in trigger item for Slack identity extraction');
            throw new Error('No headers found in trigger item for Slack identity extraction');
        }
        const timestamp = this.getHeader(headers, 'x-slack-request-timestamp');
        const signature = this.getHeader(headers, 'x-slack-signature');
        if (!timestamp) {
            this.logger.error('Missing X-Slack-Request-Timestamp header');
            throw new Error('Missing X-Slack-Request-Timestamp header');
        }
        if (!signature) {
            this.logger.error('Missing X-Slack-Signature header');
            throw new Error('Missing X-Slack-Signature header');
        }
        const rawBody = this.getRawBody(triggerItem);
        headers['x-slack-signature'] = '**********';
        headers['x-slack-request-timestamp'] = '**********';
        return {
            triggerItems: options.triggerItems,
            contextUpdate: {
                credentials: {
                    identity: rawBody,
                    version: 1,
                    metadata: {
                        source: 'slack-signature',
                        timestamp,
                        signature,
                    },
                },
            },
        };
    }
    getHeader(headers, name) {
        const value = headers[name] ?? headers[name.toLowerCase()];
        return typeof value === 'string' ? value : undefined;
    }
    getRawBody(triggerItem) {
        const result = zod_1.z.record(zod_1.z.string(), zod_1.z.string()).safeParse(triggerItem.json['body']);
        if (!result.success) {
            this.logger.error('Could not retrieve raw body for Slack signature verification');
            throw new Error('Could not retrieve raw body for Slack signature verification.');
        }
        return new URLSearchParams(result.data).toString();
    }
};
exports.SlackSignatureExtractor = SlackSignatureExtractor;
exports.SlackSignatureExtractor = SlackSignatureExtractor = __decorate([
    (0, decorators_1.ContextEstablishmentHook)(),
    __metadata("design:paramtypes", [backend_common_1.Logger])
], SlackSignatureExtractor);
//# sourceMappingURL=slack-signature-extractor.js.map