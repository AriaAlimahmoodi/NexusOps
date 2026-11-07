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
exports.ChatHubDeprecatedRule = void 0;
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const detection_report_1 = require("../../detection-report");
const CHAT_ENABLED_KEY = 'chat.access.enabled';
let ChatHubDeprecatedRule = class ChatHubDeprecatedRule {
    constructor(settingsRepository) {
        this.settingsRepository = settingsRepository;
        this.id = 'chat-hub-deprecated-v3';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: 'Chat hub is deprecated and off by default',
            description: 'In v3, the chat hub module is off by default and the Chat section disappears from the UI. You can turn it on again with the N8N_ENABLED_MODULES environment variable, but the feature is removed in v4.',
            category: "instance",
            impact: 'capabilityRemoved',
            documentationUrl: 'https://docs.n8n.io/changelog/v30-breaking-changes',
        };
    }
    async detect() {
        const setting = await this.settingsRepository.findByKey(CHAT_ENABLED_KEY);
        if (setting?.value !== 'true') {
            return detection_report_1.NOT_AFFECTED_INSTANCE;
        }
        return {
            isAffected: true,
            instanceIssues: [
                {
                    title: 'This instance uses chat hub',
                    description: 'Chat hub is on for this instance. After the update to v3, the chat hub module is off by default, so users lose access to the Chat section and to their chat sessions and agents. The chat data stays in the database.',
                    level: 'warning',
                },
            ],
            recommendations: [
                {
                    action: 'Turn chat hub on again if you still need it',
                    description: 'Add `chat-hub` to the N8N_ENABLED_MODULES environment variable to keep chat hub available in v3. The variable holds a comma-separated list, so keep the modules that you already enable. This is a temporary measure: v4 removes the feature.',
                },
            ],
        };
    }
};
exports.ChatHubDeprecatedRule = ChatHubDeprecatedRule;
exports.ChatHubDeprecatedRule = ChatHubDeprecatedRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' }),
    __metadata("design:paramtypes", [db_1.SettingsRepository])
], ChatHubDeprecatedRule);
//# sourceMappingURL=chat-hub-deprecated.rule.js.map