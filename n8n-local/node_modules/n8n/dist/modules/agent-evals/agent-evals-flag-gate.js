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
exports.AgentEvalsFlagGate = void 0;
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const posthog_1 = require("../../posthog");
let AgentEvalsFlagGate = class AgentEvalsFlagGate {
    constructor(postHogClient) {
        this.postHogClient = postHogClient;
    }
    async isEnabled(user) {
        const flags = await this.postHogClient.getFeatureFlags(user);
        return flags?.[api_types_1.AGENT_EVALS_FLAG] === true;
    }
    async assertEnabled(user) {
        if (!(await this.isEnabled(user)))
            throw new errors_1.NotFoundError('Not found');
    }
};
exports.AgentEvalsFlagGate = AgentEvalsFlagGate;
exports.AgentEvalsFlagGate = AgentEvalsFlagGate = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [posthog_1.PostHogClient])
], AgentEvalsFlagGate);
//# sourceMappingURL=agent-evals-flag-gate.js.map