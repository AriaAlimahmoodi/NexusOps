"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisabledNodesRule = void 0;
const decorators_1 = require("@n8n/decorators");
let DisabledNodesRule = class DisabledNodesRule {
    constructor() {
        this.DISABLED_NODES = [
            'n8n-nodes-base.executeCommand',
            'n8n-nodes-base.localFileTrigger',
        ];
        this.id = 'disabled-nodes-v2';
    }
    getMetadata() {
        return {
            version: 'v2',
            title: 'Disable ExecuteCommand and LocalFileTrigger nodes by default',
            description: 'ExecuteCommand and LocalFileTrigger nodes are now disabled by default for security reasons',
            category: "workflow",
            impact: 'executionsFail',
            documentationUrl: 'https://docs.n8n.io/2-0-breaking-changes/#disable-executecommand-and-localfiletrigger-nodes-by-default',
        };
    }
    async getRecommendations(_workflowResults) {
        return [
            {
                action: 'Enable nodes if required',
                description: 'Set the appropriate environment variables or settings to enable these nodes if they are required for your workflows',
            },
            {
                action: 'Replace with alternatives',
                description: 'Consider replacing these nodes with safer alternatives that achieve the same functionality',
            },
        ];
    }
    async detectWorkflow(_workflow, nodesGroupedByType) {
        if (process.env.NODES_EXCLUDE) {
            return { isAffected: false, issues: [] };
        }
        const disabledNodes = this.DISABLED_NODES.flatMap((type) => nodesGroupedByType.get(type) ?? []);
        if (disabledNodes.length === 0)
            return { isAffected: false, issues: [] };
        return {
            isAffected: true,
            issues: disabledNodes.map((node) => ({
                title: `Node '${node.type}' with name '${node.name}' will be disabled`,
                description: `This node is disabled by default in v2. If you want to keep using ${node.type} node, you can configure NODES_EXCLUDE=[].`,
                level: 'error',
                nodeId: node.id,
                nodeName: node.name,
            })),
        };
    }
};
exports.DisabledNodesRule = DisabledNodesRule;
exports.DisabledNodesRule = DisabledNodesRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v2' })
], DisabledNodesRule);
//# sourceMappingURL=disabled-nodes.rule.js.map