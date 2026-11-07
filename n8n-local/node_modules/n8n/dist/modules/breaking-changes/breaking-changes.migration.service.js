"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BreakingChangeMigrationService = exports.WORKFLOW_NOT_EDITABLE_MESSAGE = exports.WorkflowMigrationNodeError = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const node_types_1 = require("../../node-types");
const workflow_finder_service_1 = require("../../workflows/workflow-finder.service");
const workflow_validation_service_1 = require("../../workflows/workflow-validation.service");
const workflow_service_1 = require("../../workflows/workflow.service");
const breaking_changes_migration_registry_service_1 = require("./breaking-changes.migration-registry.service");
const breaking_changes_rule_registry_service_1 = require("./breaking-changes.rule-registry.service");
const group_nodes_by_type_1 = require("./group-nodes-by-type");
const node_migration_1 = require("./migrations/node-migration");
Object.defineProperty(exports, "WorkflowMigrationNodeError", { enumerable: true, get: function () { return node_migration_1.WorkflowMigrationNodeError; } });
exports.WORKFLOW_NOT_EDITABLE_MESSAGE = 'Workflow not found, or you do not have permission to update it.';
let BreakingChangeMigrationService = class BreakingChangeMigrationService {
    constructor(ruleRegistry, migrationRegistry, workflowFinderService, workflowService, workflowValidationService, nodeTypes, logger) {
        this.ruleRegistry = ruleRegistry;
        this.migrationRegistry = migrationRegistry;
        this.workflowFinderService = workflowFinderService;
        this.workflowService = workflowService;
        this.workflowValidationService = workflowValidationService;
        this.nodeTypes = nodeTypes;
        this.logger = logger;
        this.logger = logger.scoped('breaking-changes');
    }
    async migrateWorkflow(ruleId, workflowId, user) {
        const migration = this.migrationRegistry.get(ruleId);
        if (!migration) {
            throw new errors_1.BadRequestError(`No automated migration is available for rule '${ruleId}'.`);
        }
        const rule = this.ruleRegistry.getRule(ruleId);
        if (!rule || !('detectWorkflow' in rule)) {
            throw new errors_1.BadRequestError(`Rule '${ruleId}' does not support automated migration.`);
        }
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
            'workflow:update',
        ]);
        if (!workflow) {
            throw new errors_1.NotFoundError(exports.WORKFLOW_NOT_EDITABLE_MESSAGE);
        }
        const wasPublishedVersion = !!workflow.activeVersionId && workflow.activeVersionId === workflow.versionId;
        const detection = await rule.detectWorkflow(workflow, (0, group_nodes_by_type_1.groupNodesByType)(workflow.nodes));
        const affectedNodeIds = new Set(detection.issues.map((issue) => issue.nodeId).filter((id) => Boolean(id)));
        if (affectedNodeIds.size === 0) {
            throw new errors_1.BadRequestError('This workflow has no nodes affected by the selected rule.');
        }
        const applied = (0, node_migration_1.isWorkflowMigration)(migration)
            ? this.applyWorkflowMigration(migration, workflow, affectedNodeIds)
            : this.applyNodeMigration(migration, workflow, affectedNodeIds);
        const { nodes, connections, migratedNodeIds } = applied;
        const unmapped = applied.unmapped ?? [];
        const notes = applied.notes ?? [];
        const republishable = unmapped.length === 0 &&
            notes.length === 0 &&
            wasPublishedVersion &&
            (await this.workflowValidationService.validateForActivation(Object.fromEntries(nodes.map((node) => [node.name, node])), connections, this.nodeTypes)).isValid;
        const expectedChecksum = await (0, n8n_workflow_1.calculateWorkflowChecksum)(workflow);
        workflow.nodes = nodes;
        workflow.connections = connections;
        const updated = await this.workflowService.update(user, workflow, workflowId, {
            versionName: 'Automated node migration',
            expectedChecksum,
        });
        this.logger.info('Applied automated node migration', {
            ruleId,
            workflowId,
            migratedNodeIds,
        });
        return {
            workflowId,
            newVersionId: updated.versionId,
            migratedNodeIds,
            unmapped,
            notes,
            republishable,
        };
    }
    applyNodeMigration(migration, workflow, affectedNodeIds) {
        const unmapped = [];
        const notes = [];
        const migratedNodeIds = [];
        const migratedNodes = workflow.nodes.map((node) => {
            if (!affectedNodeIds.has(node.id))
                return node;
            let result;
            try {
                result = migration.migrate(node);
            }
            catch (error) {
                throw new node_migration_1.WorkflowMigrationNodeError(error instanceof Error ? error.message : 'Migration failed.', { nodeId: node.id, nodeName: node.name });
            }
            migratedNodeIds.push(node.id);
            if (result.unmapped?.length)
                unmapped.push(...result.unmapped);
            if (result.notes?.length)
                notes.push(...result.notes);
            return {
                ...node,
                type: result.node.type,
                typeVersion: result.node.typeVersion,
                parameters: result.node.parameters,
            };
        });
        return {
            nodes: migratedNodes,
            connections: workflow.connections,
            migratedNodeIds,
            unmapped,
            notes,
        };
    }
    applyWorkflowMigration(migration, workflow, affectedNodeIds) {
        try {
            return migration.migrateWorkflow({
                nodes: workflow.nodes,
                connections: workflow.connections,
                affectedNodeIds,
            });
        }
        catch (error) {
            if (error instanceof node_migration_1.WorkflowMigrationNodeError)
                throw error;
            throw new errors_1.BadRequestError(error instanceof Error ? error.message : 'Migration failed.');
        }
    }
};
exports.BreakingChangeMigrationService = BreakingChangeMigrationService;
exports.BreakingChangeMigrationService = BreakingChangeMigrationService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [breaking_changes_rule_registry_service_1.RuleRegistry, breaking_changes_migration_registry_service_1.MigrationRegistry, workflow_finder_service_1.WorkflowFinderService, workflow_service_1.WorkflowService, workflow_validation_service_1.WorkflowValidationService, node_types_1.NodeTypes, backend_common_1.Logger])
], BreakingChangeMigrationService);
//# sourceMappingURL=breaking-changes.migration.service.js.map