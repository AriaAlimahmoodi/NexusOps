"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileAccessRule = void 0;
const decorators_1 = require("@n8n/decorators");
let FileAccessRule = class FileAccessRule {
    constructor() {
        this.FILE_NODES = ['n8n-nodes-base.readWriteFile', 'n8n-nodes-base.readBinaryFiles'];
        this.id = 'file-access-restriction-v2';
    }
    getMetadata() {
        return {
            version: 'v2',
            title: 'File Access Restrictions',
            description: 'File access is now restricted to a default directory for security purposes',
            category: "workflow",
            impact: 'executionsFail',
            documentationUrl: 'https://docs.n8n.io/2-0-breaking-changes/#set-default-value-for-n8nrestrictfileaccessto',
        };
    }
    async getRecommendations(_workflowResults) {
        return [
            {
                action: 'Configure file access paths',
                description: 'Set N8N_RESTRICT_FILE_ACCESS_TO to a semicolon-separated list of allowed paths if workflows need to access files outside the default directory',
            },
        ];
    }
    async detectWorkflow(_workflow, nodesGroupedByType) {
        const fileNodes = this.FILE_NODES.flatMap((nodeType) => nodesGroupedByType.get(nodeType) ?? []);
        if (fileNodes.length === 0)
            return { isAffected: false, issues: [] };
        return {
            isAffected: true,
            issues: fileNodes.map((node) => ({
                title: `File access node '${node.type}' with name '${node.name}' affected`,
                description: 'File access for this node is now restricted to configured directories.',
                level: 'warning',
                nodeId: node.id,
                nodeName: node.name,
            })),
        };
    }
};
exports.FileAccessRule = FileAccessRule;
exports.FileAccessRule = FileAccessRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v2' })
], FileAccessRule);
//# sourceMappingURL=file-access.rule.js.map