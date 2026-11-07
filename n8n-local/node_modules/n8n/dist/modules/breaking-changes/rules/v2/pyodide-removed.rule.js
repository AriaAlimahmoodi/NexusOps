"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PyodideRemovedRule = void 0;
const decorators_1 = require("@n8n/decorators");
const detection_report_1 = require("../../detection-report");
let PyodideRemovedRule = class PyodideRemovedRule {
    constructor() {
        this.id = 'pyodide-removed-v2';
    }
    getMetadata() {
        return {
            version: 'v2',
            title: 'Remove Pyodide-based Python in Code node',
            description: 'The Pyodide-based Python implementation in the Code node has been removed and replaced with a native Python task runner implementation',
            category: "workflow",
            impact: 'executionsFail',
            documentationUrl: 'https://docs.n8n.io/2-0-breaking-changes/#remove-pyodide-based-python-code-node-and-tool',
        };
    }
    async getRecommendations(_workflowResults) {
        return [
            {
                action: 'Update Code nodes to use native Python',
                description: 'Manually update affected Code nodes from the legacy python parameter to the new pythonNative parameter',
            },
            {
                action: 'Review and adjust Python scripts',
                description: 'Review Code node scripts relying on Pyodide syntax and adjust for breaking changes. See: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code/#python-native',
            },
            {
                action: 'Set up Python task runner',
                description: 'Ensure a Python task runner is available and configured. Native Python task runners are enabled by default in v2',
            },
        ];
    }
    async detectWorkflow(_workflow, nodesGroupedByType) {
        const codeNodes = nodesGroupedByType.get('n8n-nodes-base.code') ?? [];
        const codeToolNodes = nodesGroupedByType.get('@n8n/n8n-nodes-langchain.toolCode') ?? [];
        const affectedNodes = codeNodes.concat(codeToolNodes).filter((node) => {
            const language = node.parameters?.language;
            return language === 'python';
        });
        return (0, detection_report_1.reportAffectedNodes)(affectedNodes, (node) => ({
            title: `Code node '${node.name}' uses removed Pyodide Python implementation`,
            description: 'The Pyodide-based Python implementation (language="python") is no longer supported. This node must be migrated to use the task runner-based implementation (language="pythonNative").',
            level: 'error',
        }));
    }
};
exports.PyodideRemovedRule = PyodideRemovedRule;
exports.PyodideRemovedRule = PyodideRemovedRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v2' })
], PyodideRemovedRule);
//# sourceMappingURL=pyodide-removed.rule.js.map