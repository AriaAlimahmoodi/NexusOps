"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TunnelOptionRule = void 0;
const decorators_1 = require("@n8n/decorators");
let TunnelOptionRule = class TunnelOptionRule {
    constructor() {
        this.id = 'tunnel-option-v2';
    }
    getMetadata() {
        return {
            version: 'v2',
            title: 'Remove n8n --tunnel option',
            description: 'The --tunnel CLI option has been removed and will be ignored',
            category: "instance",
            impact: 'capabilityRemoved',
            documentationUrl: 'https://docs.n8n.io/2-0-breaking-changes/#remove-n8n-tunnel-option',
        };
    }
    async detect() {
        const result = {
            isAffected: true,
            instanceIssues: [
                {
                    title: '--tunnel option removed',
                    description: 'The --tunnel CLI option is no longer available. If you were using this feature, calls with the --tunnel flag will ignore the flag and not run the tunnel system.',
                    level: 'info',
                },
            ],
            recommendations: [],
        };
        return result;
    }
};
exports.TunnelOptionRule = TunnelOptionRule;
exports.TunnelOptionRule = TunnelOptionRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v2' })
], TunnelOptionRule);
//# sourceMappingURL=tunnel-option.rule.js.map