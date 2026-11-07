"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthCallbackAuthRule = void 0;
const decorators_1 = require("@n8n/decorators");
const detection_report_1 = require("../../detection-report");
let OAuthCallbackAuthRule = class OAuthCallbackAuthRule {
    constructor() {
        this.id = 'oauth-callback-auth-v2';
    }
    getMetadata() {
        return {
            version: 'v2',
            title: 'Require auth on OAuth callback URLs by default',
            description: 'OAuth callbacks now enforce n8n user authentication by default for improved security',
            category: "instance",
            impact: 'behaviorChanges',
            documentationUrl: 'https://docs.n8n.io/2-0-breaking-changes/#require-authentication-on-oauth-callback-urls-by-default',
        };
    }
    async detect() {
        if (process.env.N8N_SKIP_AUTH_ON_OAUTH_CALLBACK) {
            return detection_report_1.NOT_AFFECTED_INSTANCE;
        }
        return {
            isAffected: true,
            instanceIssues: [
                {
                    title: 'OAuth callback authentication now required',
                    description: 'OAuth callbacks will now enforce n8n user authentication by default unless N8N_SKIP_AUTH_ON_OAUTH_CALLBACK is explicitly set to true.',
                    level: 'warning',
                },
            ],
            recommendations: [
                {
                    action: 'Review OAuth workflows',
                    description: 'If you need to skip authentication on OAuth callbacks (e.g., for embed mode), set N8N_SKIP_AUTH_ON_OAUTH_CALLBACK=true',
                },
            ],
        };
    }
};
exports.OAuthCallbackAuthRule = OAuthCallbackAuthRule;
exports.OAuthCallbackAuthRule = OAuthCallbackAuthRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v2' })
], OAuthCallbackAuthRule);
//# sourceMappingURL=oauth-callback-auth.rule.js.map