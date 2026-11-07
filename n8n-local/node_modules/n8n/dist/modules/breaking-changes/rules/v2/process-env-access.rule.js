"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessEnvAccessRule = void 0;
const decorators_1 = require("@n8n/decorators");
let ProcessEnvAccessRule = class ProcessEnvAccessRule {
    constructor() {
        this.id = 'process-env-access-v2';
    }
    getMetadata() {
        return {
            version: 'v2',
            title: 'Block process.env Access in Expressions and Code nodes',
            description: 'Direct access to process.env is blocked by default for security',
            category: "workflow",
            impact: 'executionsFail',
            documentationUrl: 'https://docs.n8n.io/2-0-breaking-changes/#block-environment-variable-access-from-code-node-by-default',
        };
    }
    async detectWorkflow(workflow, _nodesGroupedByType) {
        if (process.env.N8N_BLOCK_ENV_ACCESS_IN_NODE) {
            return {
                isAffected: false,
                issues: [],
            };
        }
        const processEnvPattern = /process\s*(?:\/\*[\s\S]*?\*\/)?\s*\??\.?\s*env\b/;
        const affectedNodes = [];
        workflow.nodes.forEach((node) => {
            if (node.type === 'n8n-nodes-base.code') {
                const code = typeof node.parameters?.code === 'string' ? node.parameters.code : undefined;
                if (code && processEnvPattern.test(code)) {
                    affectedNodes.push({ nodeId: node.id, nodeName: node.name });
                }
            }
            else {
                const nodeJson = JSON.stringify(node.parameters ?? {});
                if (processEnvPattern.test(nodeJson) && !affectedNodes.some((n) => n.nodeId === node.id)) {
                    affectedNodes.push({ nodeId: node.id, nodeName: node.name });
                }
            }
        });
        return {
            isAffected: affectedNodes.length > 0,
            issues: affectedNodes.map((n) => ({
                title: 'process.env access detected',
                description: `Node with name '${n.nodeName}' accesses process.env which is blocked by default for security reasons.`,
                level: 'error',
                nodeId: n.nodeId,
                nodeName: n.nodeName,
            })) || [],
        };
    }
    async getRecommendations() {
        return [
            {
                action: 'Remove process.env usage',
                description: 'Replace process.env with environment variables configured in n8n',
            },
            {
                action: 'Enable access if required',
                description: 'Set N8N_BLOCK_ENV_ACCESS_IN_NODE=false to allow access',
            },
        ];
    }
};
exports.ProcessEnvAccessRule = ProcessEnvAccessRule;
exports.ProcessEnvAccessRule = ProcessEnvAccessRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v2' })
], ProcessEnvAccessRule);
//# sourceMappingURL=process-env-access.rule.js.map