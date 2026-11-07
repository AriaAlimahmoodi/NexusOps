"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnpublishWorkflowCommand = void 0;
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const zod_1 = require("zod");
const base_command_1 = require("../base-command");
const flagsSchema = zod_1.z.object({
    all: zod_1.z.boolean().describe('Unpublish all workflows').optional(),
    id: zod_1.z.string().describe('The ID of the workflow to unpublish').optional(),
});
let UnpublishWorkflowCommand = class UnpublishWorkflowCommand extends base_command_1.BaseCommand {
    async run() {
        const { flags } = this;
        if (!flags.all && !flags.id) {
            this.logger.error('Either option "--all" or "--id" must be set.');
            return;
        }
        if (flags.all && flags.id) {
            this.logger.error('Cannot use both "--all" and "--id" flags together.');
            return;
        }
        if (flags.id) {
            this.logger.info(`Unpublishing workflow with ID: ${flags.id}`);
            await di_1.Container.get(db_1.WorkflowRepository).updateActiveState(flags.id, false);
            this.logger.info('Workflow unpublished successfully');
        }
        else {
            this.logger.info('Unpublishing all workflows');
            await di_1.Container.get(db_1.WorkflowRepository).unpublishAll();
            this.logger.info('All workflows unpublished successfully');
        }
        this.logger.info('Note: Changes will not take effect if n8n is running.');
        this.logger.info('Please restart n8n for changes to take effect if n8n is currently running.');
    }
    async catch(error) {
        this.logError(error, 'Error unpublishing workflow(s). See log messages for details.');
    }
};
exports.UnpublishWorkflowCommand = UnpublishWorkflowCommand;
exports.UnpublishWorkflowCommand = UnpublishWorkflowCommand = __decorate([
    (0, decorators_1.Command)({
        name: 'unpublish:workflow',
        description: 'Unpublish workflow(s)',
        examples: ['--all', '--id=5'],
        flagsSchema,
    })
], UnpublishWorkflowCommand);
//# sourceMappingURL=workflow.js.map