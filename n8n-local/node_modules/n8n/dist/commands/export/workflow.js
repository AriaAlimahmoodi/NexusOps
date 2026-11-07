"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportWorkflowsCommand = void 0;
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const fs_1 = __importDefault(require("fs"));
const n8n_workflow_1 = require("n8n-workflow");
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
const base_command_1 = require("../base-command");
require("../../zod-alias-support");
const flagsSchema = zod_1.z.object({
    all: zod_1.z.boolean().describe('Export all workflows').optional(),
    backup: zod_1.z
        .boolean()
        .describe('Sets --all --pretty --separate for simple backups. Only --output has to be set additionally.')
        .optional(),
    id: zod_1.z.string().describe('The ID of the workflow to export').optional(),
    projectId: zod_1.z.string().describe('Export all workflows in the specified project').optional(),
    output: zod_1.z
        .string()
        .alias('o')
        .describe('Output file name or directory if using separate files')
        .optional(),
    pretty: zod_1.z.boolean().describe('Format the output in an easier to read fashion').optional(),
    separate: zod_1.z
        .boolean()
        .describe('Exports one file per workflow (useful for versioning). Must inform a directory via --output.')
        .optional(),
    version: zod_1.z.string().describe('The version ID to export').optional(),
    published: zod_1.z.boolean().describe('Export the published/active version').optional(),
});
let ExportWorkflowsCommand = class ExportWorkflowsCommand extends base_command_1.BaseCommand {
    async run() {
        const { flags } = this;
        if (flags.backup) {
            flags.all = true;
            flags.pretty = true;
            flags.separate = true;
        }
        if (flags.version && flags.published) {
            this.logger.info('Cannot use both --version and --published flags. Please specify one.');
            return;
        }
        if (flags.version && flags.all) {
            this.logger.info('--version flag cannot be used with --all flag.');
            return;
        }
        const selectorCount = [flags.all, flags.id, flags.projectId].filter(Boolean).length;
        if (selectorCount === 0) {
            this.logger.info('One of "--all", "--id", or "--projectId" has to be set!');
            return;
        }
        if (selectorCount > 1) {
            this.logger.info('Use exactly one of "--all", "--id", or "--projectId".');
            return;
        }
        if (flags.separate) {
            try {
                if (!flags.output) {
                    this.logger.info('You must inform an output directory via --output when using --separate');
                    return;
                }
                if (fs_1.default.existsSync(flags.output)) {
                    if (!fs_1.default.lstatSync(flags.output).isDirectory()) {
                        this.logger.info('The parameter --output must be a directory');
                        return;
                    }
                }
                else {
                    fs_1.default.mkdirSync(flags.output, { recursive: true });
                }
            }
            catch (e) {
                throw new n8n_workflow_1.UserError(`Filesystem error while creating the output directory: ${e instanceof Error ? e.message : String(e)}`);
            }
        }
        else if (flags.output) {
            if (fs_1.default.existsSync(flags.output)) {
                if (fs_1.default.lstatSync(flags.output).isDirectory()) {
                    this.logger.info('The parameter --output must be a writeable file');
                    return;
                }
            }
        }
        const workflows = await di_1.Container.get(db_1.WorkflowRepository).find({
            where: this.getWhereFilter(flags),
            relations: ['tags', 'shared', 'shared.project'],
        });
        if (workflows.length === 0) {
            throw new n8n_workflow_1.UserError('No workflows found with specified filters');
        }
        const workflowsToExport = await getWorkflowsToExport(workflows, flags);
        if (flags.published && workflowsToExport.length === 0) {
            if (flags.id)
                throw new n8n_workflow_1.UserError(`No published version found for workflow "${workflows[0].name}" (${workflows[0].id})`);
            else
                throw new n8n_workflow_1.UserError('No workflows with published versions found.');
        }
        if (flags.version && flags.id && workflowsToExport.length === 0) {
            throw new n8n_workflow_1.UserError(`Version "${flags.version}" not found for workflow "${workflows[0].name}" (${workflows[0].id})`);
        }
        if (workflowsToExport.length === 0) {
            throw new n8n_workflow_1.UserError('No workflows found with specified filters');
        }
        if (flags.separate) {
            let fileContents;
            let i;
            for (i = 0; i < workflowsToExport.length; i++) {
                fileContents = JSON.stringify(workflowsToExport[i], null, flags.pretty ? 2 : undefined);
                const filename = `${(flags.output.endsWith(path_1.default.sep) ? flags.output : flags.output + path_1.default.sep) +
                    workflowsToExport[i].id}.json`;
                fs_1.default.writeFileSync(filename, fileContents);
            }
            this.logger.info(`Successfully exported ${i} workflows.`);
        }
        else {
            const fileContents = JSON.stringify(workflowsToExport, null, flags.pretty ? 2 : undefined);
            if (flags.output) {
                fs_1.default.writeFileSync(flags.output, fileContents);
                this.logger.info(`Successfully exported ${workflowsToExport.length} ${workflowsToExport.length === 1 ? 'workflow.' : 'workflows.'}`);
            }
            else {
                this.logger.info(fileContents);
            }
        }
        const selector = flags.all ? 'all' : flags.id ? 'id' : 'projectId';
        di_1.Container.get(backend_services_1.EventService).emit('server-cli-export', {
            selector,
            published: flags.published ?? false,
            separate: flags.separate ?? false,
            backup: flags.backup ?? false,
            workflowCount: workflowsToExport.length,
        });
    }
    async catch(error) {
        this.logger.error('Error exporting workflows. See log messages for details.');
        this.logger.debug(error.message);
    }
    getWhereFilter(flags) {
        if (flags.id) {
            return { id: flags.id };
        }
        if (flags.projectId) {
            return { shared: { projectId: flags.projectId } };
        }
        return {};
    }
};
exports.ExportWorkflowsCommand = ExportWorkflowsCommand;
exports.ExportWorkflowsCommand = ExportWorkflowsCommand = __decorate([
    (0, decorators_1.Command)({
        name: 'export:workflow',
        description: 'Export workflows',
        examples: [
            '--all',
            '--projectId=Ox8O54VQrmBrb4qL',
            '--id=5 --output=file.json',
            '--id=5 --version=abc-123-def',
            '--id=5 --published',
            '--all --published --output=backups/latest/',
            '--all --output=backups/latest/',
            '--backup --output=backups/latest/',
        ],
        flagsSchema,
    })
], ExportWorkflowsCommand);
async function getWorkflowsToExport(workflows, flags) {
    const versionIdByWorkflow = new Map();
    const workflowVersionPairs = [];
    for (const workflow of workflows) {
        const versionId = getTargetVersionId(workflow, flags);
        if (versionId) {
            versionIdByWorkflow.set(workflow.id, versionId);
            workflowVersionPairs.push({ workflowId: workflow.id, versionId });
        }
    }
    const workflowHistories = workflowVersionPairs.length > 0
        ? await di_1.Container.get(db_1.WorkflowHistoryRepository).find({
            where: workflowVersionPairs,
        })
        : [];
    const historyMap = new Map(workflowHistories.map((h) => [`${h.workflowId}:${h.versionId}`, h]));
    return mergeHistoriesIntoWorkflows(workflows, versionIdByWorkflow, historyMap, flags);
}
function getTargetVersionId(workflow, flags) {
    if (flags.published)
        return workflow.activeVersionId ?? null;
    if (flags.version)
        return flags.version;
    return workflow.versionId ?? null;
}
function mergeHistoriesIntoWorkflows(workflows, versionIdByWorkflow, historyMap, flags) {
    return workflows
        .map((workflow) => {
        const versionId = versionIdByWorkflow.get(workflow.id);
        if (!versionId)
            return null;
        const history = historyMap.get(`${workflow.id}:${versionId}`);
        if (!history && (flags.published || flags.version))
            return null;
        if (history) {
            return {
                ...workflow,
                nodes: history.nodes,
                connections: history.connections,
                nodeGroups: history.nodeGroups,
                versionId: history.versionId,
                versionMetadata: {
                    name: history.name,
                    description: history.description,
                },
            };
        }
        return {
            ...workflow,
            versionMetadata: null,
        };
    })
        .filter((w) => w !== null);
}
//# sourceMappingURL=workflow.js.map