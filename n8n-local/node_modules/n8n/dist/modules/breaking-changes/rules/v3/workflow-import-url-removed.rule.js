"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowImportUrlRemovedRule = void 0;
const decorators_1 = require("@n8n/decorators");
let WorkflowImportUrlRemovedRule = class WorkflowImportUrlRemovedRule {
    constructor() {
        this.id = 'workflow-import-url-removed-v3';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: 'Workflow import from URL is removed',
            description: 'The "Import from URL" option in the editor is removed.',
            category: "instance",
            impact: 'capabilityRemoved',
        };
    }
    async detect() {
        return {
            isAffected: true,
            instanceIssues: [
                {
                    title: 'Import from URL removed from the editor',
                    description: 'The editor no longer offers importing a workflow from a URL. If you share workflows as URLs, this will stop working after the update.',
                    level: 'info',
                },
            ],
            recommendations: [
                {
                    action: 'Share workflows as files instead',
                    description: 'Download workflows as JSON files and use the editor\'s "Import from File" option, or exchange workflows via source control environments.',
                },
            ],
        };
    }
};
exports.WorkflowImportUrlRemovedRule = WorkflowImportUrlRemovedRule;
exports.WorkflowImportUrlRemovedRule = WorkflowImportUrlRemovedRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' })
], WorkflowImportUrlRemovedRule);
//# sourceMappingURL=workflow-import-url-removed.rule.js.map