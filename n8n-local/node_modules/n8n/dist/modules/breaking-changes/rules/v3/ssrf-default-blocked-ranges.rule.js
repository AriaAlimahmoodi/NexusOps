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
exports.SsrfDefaultBlockedRangesRule = void 0;
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const detection_report_1 = require("../../detection-report");
let SsrfDefaultBlockedRangesRule = class SsrfDefaultBlockedRangesRule {
    constructor(globalConfig) {
        this.globalConfig = globalConfig;
        this.id = 'ssrf-default-blocked-ranges-v3';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: 'SSRF protection blocks more IP ranges by default',
            description: 'The built-in blocked IP ranges expand to include the shared address space (100.64.0.0/10) and IPv6 transition ranges. Requests to hosts in these ranges start failing on instances with SSRF protection enabled.',
            category: "environment",
            impact: 'executionsFail',
            documentationUrl: 'https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/use-environment-variables/security',
        };
    }
    async detect() {
        const ranges = process.env.N8N_SSRF_BLOCKED_IP_RANGES;
        const usesDefaultList = ranges === undefined ||
            ranges
                .toLowerCase()
                .split(',')
                .some((r) => r.trim() === 'default');
        if (!this.globalConfig.ssrfProtection.enabled || !usesDefaultList) {
            return detection_report_1.NOT_AFFECTED_INSTANCE;
        }
        return {
            isAffected: true,
            instanceIssues: [
                {
                    title: 'SSRF protection uses the built-in blocked IP ranges',
                    description: 'N8N_SSRF_PROTECTION_ENABLED is true and N8N_SSRF_BLOCKED_IP_RANGES relies on the built-in list, either because it is not set or because it contains the `default` keyword. After the update, that list also covers 100.64.0.0/10 and IPv6 transition ranges, so workflows calling hosts in these ranges fail.',
                    level: 'warning',
                },
            ],
            recommendations: [
                {
                    action: 'Review internal hosts in the newly blocked ranges',
                    description: "Check if any workflow calls hosts in 100.64.0.0/10 or IPv6 transition ranges. Add the ones you still need to N8N_SSRF_ALLOWED_IP_RANGES or N8N_SSRF_ALLOWED_HOSTNAMES. To keep the current list exactly, set N8N_SSRF_BLOCKED_IP_RANGES to the literal ranges; the `default` keyword always expands to the running version's built-in list.",
                },
            ],
        };
    }
};
exports.SsrfDefaultBlockedRangesRule = SsrfDefaultBlockedRangesRule;
exports.SsrfDefaultBlockedRangesRule = SsrfDefaultBlockedRangesRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' }),
    __metadata("design:paramtypes", [config_1.GlobalConfig])
], SsrfDefaultBlockedRangesRule);
//# sourceMappingURL=ssrf-default-blocked-ranges.rule.js.map