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
exports.DataTableProxyService = void 0;
exports.isAllowedNode = isAllowedNode;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const check_access_1 = require("../../permissions.ee/check-access");
const backend_services_1 = require("@n8n/backend-services");
const ownership_service_1 = require("../../services/ownership.service");
const data_table_aggregate_service_1 = require("./data-table-aggregate.service");
const data_table_permissions_1 = require("./data-table-permissions");
const data_table_service_1 = require("./data-table.service");
const data_table_not_found_error_1 = require("./errors/data-table-not-found.error");
const ALLOWED_NODES = [
    'n8n-nodes-base.dataTable',
    'n8n-nodes-base.dataTableTool',
    'n8n-nodes-base.evaluationTrigger',
    'n8n-nodes-base.evaluation',
];
function isAllowedNode(s) {
    return ALLOWED_NODES.includes(s);
}
let DataTableProxyService = class DataTableProxyService {
    constructor(dataTableService, dataTableAggregateService, ownershipService, logger, instanceWriteAccess) {
        this.dataTableService = dataTableService;
        this.dataTableAggregateService = dataTableAggregateService;
        this.ownershipService = ownershipService;
        this.logger = logger;
        this.instanceWriteAccess = instanceWriteAccess;
        this.logger = this.logger.scoped('data-table');
    }
    validateRequest(node) {
        if (!isAllowedNode(node.type)) {
            throw new Error('This proxy is only available for Data table nodes');
        }
    }
    async getProjectId(workflow) {
        const homeProject = await this.ownershipService.getWorkflowProjectCached(workflow.id);
        return homeProject.id;
    }
    async getDataTableAggregateProxy(workflow, node, projectId) {
        this.validateRequest(node);
        projectId = projectId ?? (await this.getProjectId(workflow));
        return this.makeAggregateOperations(projectId);
    }
    async getDataTableProxy(workflow, node, dataTableId, projectId) {
        this.validateRequest(node);
        projectId = projectId ?? (await this.getProjectId(workflow));
        try {
            await this.dataTableService.validateDataTableExists(dataTableId, projectId);
        }
        catch (error) {
            if (error instanceof data_table_not_found_error_1.DataTableNotFoundError) {
                throw new n8n_workflow_1.NodeOperationError(node, `Data table with ID '${dataTableId}' could not be found in this project`, {
                    description: 'It may have been deleted, or skipped when the workflow was imported. Choose an existing data table in the node.',
                });
            }
            throw error;
        }
        return this.makeDataTableOperations(projectId, dataTableId);
    }
    async requireScope(user, scope, projectId) {
        const hasScope = await (0, check_access_1.userHasScopes)(user, [scope], false, { projectId });
        if (!hasScope) {
            throw new Error(`User does not have '${scope}' access on project '${projectId}'`);
        }
    }
    makeDataTableOperationsForUser(user) {
        const dataTableService = this.dataTableService;
        const dataTableAggregateService = this.dataTableAggregateService;
        const requireScope = async (scope, projectId) => await this.requireScope(user, scope, projectId);
        const instanceWriteAccess = this.instanceWriteAccess;
        return {
            async getManyAndCount(options) {
                return await dataTableAggregateService.getManyAndCount(user, options);
            },
            async createDataTable(projectId, options) {
                (0, data_table_permissions_1.assertSchemaWriteAccess)(instanceWriteAccess);
                await requireScope('dataTable:create', projectId);
                return await dataTableService.createDataTable(projectId, options);
            },
            async getColumns(dataTableId, projectId) {
                await requireScope('dataTable:read', projectId);
                return await dataTableService.getColumns(dataTableId, projectId);
            },
            async updateDataTable(dataTableId, projectId, options) {
                (0, data_table_permissions_1.assertSchemaWriteAccess)(instanceWriteAccess);
                await requireScope('dataTable:update', projectId);
                return await dataTableService.updateDataTable(dataTableId, projectId, options);
            },
            async addColumn(dataTableId, projectId, options) {
                (0, data_table_permissions_1.assertSchemaWriteAccess)(instanceWriteAccess);
                await requireScope('dataTable:update', projectId);
                return await dataTableService.addColumn(dataTableId, projectId, options);
            },
            async deleteColumn(dataTableId, projectId, columnId) {
                (0, data_table_permissions_1.assertSchemaWriteAccess)(instanceWriteAccess);
                await requireScope('dataTable:update', projectId);
                return await dataTableService.deleteColumn(dataTableId, projectId, columnId);
            },
            async renameColumn(dataTableId, projectId, columnId, options) {
                (0, data_table_permissions_1.assertSchemaWriteAccess)(instanceWriteAccess);
                await requireScope('dataTable:update', projectId);
                return await dataTableService.renameColumn(dataTableId, projectId, columnId, options);
            },
            async deleteDataTable(dataTableId, projectId) {
                (0, data_table_permissions_1.assertSchemaWriteAccess)(instanceWriteAccess);
                await requireScope('dataTable:delete', projectId);
                return await dataTableService.deleteDataTable(dataTableId, projectId);
            },
            async getManyRowsAndCount(dataTableId, projectId, options) {
                await requireScope('dataTable:readRow', projectId);
                return await dataTableService.getManyRowsAndCount(dataTableId, projectId, options);
            },
            async insertRows(dataTableId, projectId, rows, returnType) {
                await requireScope('dataTable:writeRow', projectId);
                return await dataTableService.insertRows(dataTableId, projectId, rows, returnType);
            },
            async updateRows(dataTableId, projectId, options) {
                await requireScope('dataTable:writeRow', projectId);
                await requireScope('dataTable:readRow', projectId);
                return await dataTableService.updateRows(dataTableId, projectId, { filter: options.filter, data: options.data }, true, options.dryRun);
            },
            async deleteRows(dataTableId, projectId, options) {
                await requireScope('dataTable:writeRow', projectId);
                await requireScope('dataTable:readRow', projectId);
                return await dataTableService.deleteRows(dataTableId, projectId, { filter: options.filter }, true, options.dryRun);
            },
            async clearRows(dataTableId, projectId) {
                await requireScope('dataTable:writeRow', projectId);
                return await dataTableService.clearRows(dataTableId, projectId);
            },
        };
    }
    makeAggregateOperations(projectId) {
        const dataTableService = this.dataTableService;
        return {
            getProjectId() {
                return projectId;
            },
            async getManyAndCount(options = {}) {
                const serviceOptions = {
                    ...options,
                    filter: { projectId, ...(options.filter ?? {}) },
                };
                return await dataTableService.getManyAndCount(serviceOptions);
            },
            async createDataTable(options) {
                return await dataTableService.createDataTable(projectId, options);
            },
            async deleteDataTableAll() {
                return await dataTableService.deleteDataTableByProjectId(projectId);
            },
        };
    }
    makeDataTableOperations(projectId, dataTableId) {
        const dataTableService = this.dataTableService;
        return {
            async updateDataTable(options) {
                return await dataTableService.updateDataTable(dataTableId, projectId, options);
            },
            async deleteDataTable() {
                return await dataTableService.deleteDataTable(dataTableId, projectId);
            },
            async getColumns() {
                return await dataTableService.getColumns(dataTableId, projectId);
            },
            async addColumn(options) {
                return await dataTableService.addColumn(dataTableId, projectId, options);
            },
            async moveColumn(columnId, options) {
                return await dataTableService.moveColumn(dataTableId, projectId, columnId, options);
            },
            async deleteColumn(columnId) {
                return await dataTableService.deleteColumn(dataTableId, projectId, columnId);
            },
            async getManyRowsAndCount(options) {
                return await dataTableService.getManyRowsAndCount(dataTableId, projectId, options);
            },
            async insertRows(rows, returnType) {
                return await dataTableService.insertRows(dataTableId, projectId, rows, returnType);
            },
            async updateRows(options) {
                return await dataTableService.updateRows(dataTableId, projectId, { filter: options.filter, data: options.data }, true, options.dryRun);
            },
            async upsertRow(options) {
                return await dataTableService.upsertRow(dataTableId, projectId, options, true, options.dryRun);
            },
            async deleteRows(options) {
                return await dataTableService.deleteRows(dataTableId, projectId, { filter: options.filter }, true, options.dryRun);
            },
            async clearRows() {
                return await dataTableService.clearRows(dataTableId, projectId);
            },
        };
    }
};
exports.DataTableProxyService = DataTableProxyService;
exports.DataTableProxyService = DataTableProxyService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [data_table_service_1.DataTableService, data_table_aggregate_service_1.DataTableAggregateService, ownership_service_1.OwnershipService, backend_common_1.Logger, backend_services_1.InstanceWriteAccessService])
], DataTableProxyService);
//# sourceMappingURL=data-table-proxy.service.js.map