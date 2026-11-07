"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramInteractionWebhooks = void 0;
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const hitl_interaction_webhooks_1 = require("./hitl-interaction-webhooks");
let TelegramInteractionWebhooks = class TelegramInteractionWebhooks extends hitl_interaction_webhooks_1.HitlInteractionWebhooks {
    constructor() {
        super(...arguments);
        this.platformNodeType = 'n8n-nodes-base.telegram';
    }
    async parseCallback(req) {
        await req.readRawBody();
        const update = (0, n8n_workflow_1.jsonParse)(req.rawBody?.toString() ?? '', {
            fallbackValue: {},
        });
        return (0, n8n_core_1.parseHitlCallbackReference)(update.callback_query?.data ?? '');
    }
    beforeResume(req) {
        (0, n8n_core_1.markTelegramInteractionRequest)(req);
    }
};
exports.TelegramInteractionWebhooks = TelegramInteractionWebhooks;
exports.TelegramInteractionWebhooks = TelegramInteractionWebhooks = __decorate([
    (0, di_1.Service)()
], TelegramInteractionWebhooks);
//# sourceMappingURL=telegram-interaction-webhooks.js.map