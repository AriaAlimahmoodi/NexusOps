"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiTransformDeprecatedRule = exports.AI_TRANSFORM_NODE_TYPE = void 0;
const decorators_1 = require("@n8n/decorators");
const detection_report_1 = require("../../detection-report");
exports.AI_TRANSFORM_NODE_TYPE = 'n8n-nodes-base.aiTransform';
let AiTransformDeprecatedRule = class AiTransformDeprecatedRule {
    constructor() {
        this.id = 'ai-transform-deprecated';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: 'AI Transform node is deprecated',
            description: 'The AI Transform node is deprecated. Its generated code runs as a Code node instead.',
            category: "workflow",
            impact: 'executionsFail',
        };
    }
    async getRecommendations(_workflowResults) {
        return [
            {
                action: 'Replace AI Transform with a Code node',
                description: 'The AI Transform node runs its generated JavaScript in the same sandbox as the Code node. Migrate it to a Code node to keep it working.',
            },
        ];
    }
    async detectWorkflow(_workflow, nodesGroupedByType) {
        const affectedNodes = nodesGroupedByType.get(exports.AI_TRANSFORM_NODE_TYPE) ?? [];
        return (0, detection_report_1.reportAffectedNodes)(affectedNodes, (node) => ({
            title: `Node '${node.name}' uses the deprecated AI Transform node`,
            description: 'The AI Transform node is deprecated. Migrate it to a Code node to keep it working.',
            level: 'warning',
        }));
    }
};
exports.AiTransformDeprecatedRule = AiTransformDeprecatedRule;
exports.AiTransformDeprecatedRule = AiTransformDeprecatedRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' })
], AiTransformDeprecatedRule);
//# sourceMappingURL=ai-transform-deprecated.rule.js.map