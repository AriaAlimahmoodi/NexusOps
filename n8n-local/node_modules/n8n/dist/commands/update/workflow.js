"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWorkflowCommand = void 0;
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const zod_1 = require("zod");
const base_command_1 = require("../base-command");
const flagsSchema = zod_1.z.object({
    active: zod_1.z.string().describe('Active state the workflow/s should be set to').optional(),
    all: zod_1.z.boolean().describe('Operate on all workflows').optional(),
    id: zod_1.z.string().describe('The ID of the workflow to operate on').optional(),
});
let UpdateWorkflowCommand = class UpdateWorkflowCommand extends base_command_1.BaseCommand {
    async run() {
        const workflowRepository = di_1.Container.get(db_1.WorkflowRepository);
        const { flags } = this;
        this.logger.warn('⚠️  WARNING: The "update:workflow" command is deprecated.\n');
        if (!flags.all && !flags.id) {
            this.logger.error('Either option "--all" or "--id" have to be set!');
            return;
        }
        if (flags.all && flags.id) {
            this.logger.error('Either something else on top should be "--all" or "--id" can be set never both!');
            return;
        }
        if (flags.active === undefined) {
            this.logger.error('No update flag like "--active=true" has been set!');
            return;
        }
        if (!['false', 'true'].includes(flags.active)) {
            this.logger.error('Valid values for flag "--active" are only "false" or "true"!');
            return;
        }
        const newState = flags.active === 'true';
        const action = newState ? 'Activating' : 'Deactivating';
        if (flags.id && newState) {
            this.logger.info(`Publishing workflow ${flags.id} with current version`);
            this.logger.warn(`Please use: publish:workflow --id=${flags.id}\n`);
            try {
                await workflowRepository.publishVersion(flags.id);
            }
            catch (error) {
                this.logger.error('Failed to publish workflow');
                throw error;
            }
            this.logger.info('Note: Changes will not take effect if n8n is running.');
            this.logger.info('Please restart n8n for changes to take effect if n8n is currently running.');
            return;
        }
        if (flags.all && newState) {
            this.logger.error('Workflow publishing via "update:workflow --all" is no longer supported.');
            this.logger.error('Please publish workflows individually using: publish:workflow --id=<workflow-id>');
            return;
        }
        if (flags.id) {
            this.logger.warn(`Please use: unpublish:workflow --id=${flags.id}\n`);
        }
        else {
            this.logger.warn('Please use: unpublish:workflow --all\n');
        }
        if (flags.id) {
            this.logger.info(`${action} workflow with ID: ${flags.id}`);
            await workflowRepository.updateActiveState(flags.id, newState);
        }
        else {
            this.logger.info(`${action} all workflows`);
            await workflowRepository.unpublishAll();
        }
        this.logger.info('Note: Changes will not take effect if n8n is running.');
        this.logger.info('Please restart n8n for changes to take effect if n8n is currently running.');
    }
    async catch(error) {
        this.logError(error, 'Error updating database. See log messages for details.');
    }
};
exports.UpdateWorkflowCommand = UpdateWorkflowCommand;
exports.UpdateWorkflowCommand = UpdateWorkflowCommand = __decorate([
    (0, decorators_1.Command)({
        name: 'update:workflow',
        description: '[DEPRECATED] Update workflows - use publish:workflow or unpublish:workflow instead',
        examples: ['--all --active=false', '--id=5 --active=true'],
        flagsSchema,
    })
], UpdateWorkflowCommand);
//# sourceMappingURL=workflow.js.map