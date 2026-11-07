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
exports.NodeGroupRulesFlagGate = void 0;
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const posthog_1 = require("../posthog");
let NodeGroupRulesFlagGate = class NodeGroupRulesFlagGate {
    constructor(postHogClient) {
        this.postHogClient = postHogClient;
    }
    async getEnabledRules(user) {
        const flags = await this.postHogClient.getFeatureFlags(user);
        return {
            allowTriggerInGroup: flags?.[api_types_1.GROUPS_WITH_TRIGGERS_FLAG] === true,
            allowMultipleBoundaryNodes: flags?.[api_types_1.GROUPS_WITH_MANY_BOUNDARIES_FLAG] === true,
        };
    }
};
exports.NodeGroupRulesFlagGate = NodeGroupRulesFlagGate;
exports.NodeGroupRulesFlagGate = NodeGroupRulesFlagGate = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [posthog_1.PostHogClient])
], NodeGroupRulesFlagGate);
//# sourceMappingURL=node-group-rules-flag-gate.js.map