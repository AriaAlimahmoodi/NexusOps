"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GmailTriggerVersionRule = void 0;
const decorators_1 = require("@n8n/decorators");
const detection_report_1 = require("../../detection-report");
const GMAIL_TRIGGER_NODE_TYPE = 'n8n-nodes-base.gmailTrigger';
const GMAIL_TRIGGER_LATEST_VERSION = 1.4;
let GmailTriggerVersionRule = class GmailTriggerVersionRule {
    constructor() {
        this.id = 'gmail-trigger-version-v3';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: 'Gmail Trigger always runs with version 1.4 behavior',
            description: 'Gmail Trigger versions below 1.4 are removed and every Gmail Trigger node runs with v1.4 behavior: the number of emails fetched per poll is limited by "Max Emails per Poll" (default 10, the remainder is picked up in later polls), drafts are excluded unless the "Include Drafts" filter is enabled, and sent (non-inbox) and scheduled emails no longer trigger the workflow.',
            category: "workflow",
            impact: 'behaviorChanges',
        };
    }
    async getRecommendations(_workflowResults) {
        return [
            {
                action: 'Review Gmail Trigger nodes on versions below 1.4',
                description: 'Each trigger event now emits at most 10 emails by default (configurable via "Max Emails per Poll"); the rest are picked up in later polls. Drafts only trigger workflows if "Include Drafts" is enabled in Filters. Sent (non-inbox) and scheduled emails no longer trigger workflows at all — if a workflow depends on them, use a Schedule Trigger with a Gmail "Get Many messages" operation (e.g. search "in:sent") instead.',
            },
        ];
    }
    async detectWorkflow(_workflow, nodesGroupedByType) {
        const affectedNodes = (nodesGroupedByType.get(GMAIL_TRIGGER_NODE_TYPE) ?? []).filter((node) => node.typeVersion < GMAIL_TRIGGER_LATEST_VERSION);
        return (0, detection_report_1.reportAffectedNodes)(affectedNodes, (node) => ({
            title: `Node '${node.name}' uses Gmail Trigger version ${node.typeVersion}`,
            description: 'This node will run with v1.4 behavior: emails per poll are limited by "Max Emails per Poll" (default 10, the remainder is picked up in later polls), drafts are excluded unless the "Include Drafts" filter is enabled, and sent (non-inbox) and scheduled emails no longer trigger the workflow.',
            level: 'warning',
        }));
    }
};
exports.GmailTriggerVersionRule = GmailTriggerVersionRule;
exports.GmailTriggerVersionRule = GmailTriggerVersionRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' })
], GmailTriggerVersionRule);
//# sourceMappingURL=gmail-trigger-version.rule.js.map