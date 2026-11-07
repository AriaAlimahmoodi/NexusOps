"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueWorkerMaxStalledCountRule = void 0;
const decorators_1 = require("@n8n/decorators");
let QueueWorkerMaxStalledCountRule = class QueueWorkerMaxStalledCountRule {
    constructor() {
        this.id = 'queue-worker-max-stalled-count-v2';
    }
    getMetadata() {
        return {
            version: 'v2',
            title: 'Remove QUEUE_WORKER_MAX_STALLED_COUNT',
            description: 'The QUEUE_WORKER_MAX_STALLED_COUNT environment variable has been removed and will be ignored',
            category: "environment",
            impact: 'capabilityRemoved',
            documentationUrl: 'https://docs.n8n.io/2-0-breaking-changes/#remove-queueworkermaxstalledcount',
        };
    }
    async detect() {
        const result = {
            isAffected: false,
            instanceIssues: [],
            recommendations: [],
        };
        if (!process.env.QUEUE_WORKER_MAX_STALLED_COUNT) {
            return result;
        }
        result.isAffected = true;
        result.instanceIssues.push({
            title: 'QUEUE_WORKER_MAX_STALLED_COUNT is deprecated',
            description: 'The QUEUE_WORKER_MAX_STALLED_COUNT environment variable has been removed. Any customization will be ignored in v2.',
            level: 'warning',
        });
        result.recommendations.push({
            action: 'Remove environment variable',
            description: 'Remove QUEUE_WORKER_MAX_STALLED_COUNT from your environment configuration as it no longer has any effect',
        });
        return result;
    }
};
exports.QueueWorkerMaxStalledCountRule = QueueWorkerMaxStalledCountRule;
exports.QueueWorkerMaxStalledCountRule = QueueWorkerMaxStalledCountRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v2' })
], QueueWorkerMaxStalledCountRule);
//# sourceMappingURL=queue-worker-max-stalled-count.rule.js.map