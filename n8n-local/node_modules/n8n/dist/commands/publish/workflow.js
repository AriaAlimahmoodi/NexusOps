"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishWorkflowCommand = void 0;
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const zod_1 = require("zod");
const base_command_1 = require("../base-command");
const flagsSchema = zod_1.z.object({
    id: zod_1.z.string().describe('The ID of the workflow to publish'),
    versionId: zod_1.z
        .string()
        .describe('The version ID to publish. If not provided, publishes the current version')
        .optional(),
    all: zod_1.z.boolean().describe('(Deprecated) This flag is no longer supported').optional(),
});
let PublishWorkflowCommand = class PublishWorkflowCommand extends base_command_1.BaseCommand {
    async run() {
        const { flags } = this;
        if (flags.all) {
            this.logger.error('The --all flag is no longer supported for workflow publishing.');
            this.logger.error('Please publish workflows individually using: publish:workflow --id=<workflow-id> [--versionId=<version-id>]');
            return;
        }
        if (flags.versionId) {
            this.logger.info(`Publishing workflow with ID: ${flags.id}, version: ${flags.versionId}`);
        }
        else {
            this.logger.info(`Publishing workflow with ID: ${flags.id} (current version)`);
        }
        await di_1.Container.get(db_1.WorkflowRepository).publishVersion(flags.id, flags.versionId);
        this.logger.info('Note: Changes will not take effect if n8n is running.');
        this.logger.info('Please restart n8n for changes to take effect if n8n is currently running.');
    }
    async catch(error) {
        this.logError(error, 'Error updating database. See log messages for details.');
    }
};
exports.PublishWorkflowCommand = PublishWorkflowCommand;
exports.PublishWorkflowCommand = PublishWorkflowCommand = __decorate([
    (0, decorators_1.Command)({
        name: 'publish:workflow',
        description: 'Publish a specific version of a workflow. If no version is specified, publishes the current version.',
        examples: ['--id=5 --versionId=abc123', '--id=5'],
        flagsSchema,
    })
], PublishWorkflowCommand);
//# sourceMappingURL=workflow.js.map