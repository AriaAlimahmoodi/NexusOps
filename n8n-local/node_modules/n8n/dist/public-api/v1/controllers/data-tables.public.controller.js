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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTablesPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const data_table_aggregate_service_1 = require("../../../modules/data-table/data-table-aggregate.service");
const data_table_permissions_1 = require("../../../modules/data-table/data-table-permissions");
const data_table_service_1 = require("../../../modules/data-table/data-table.service");
const data_table_access_denied_error_1 = require("../../../modules/data-table/errors/data-table-access-denied.error");
const data_table_column_name_conflict_error_1 = require("../../../modules/data-table/errors/data-table-column-name-conflict.error");
const data_table_name_conflict_error_1 = require("../../../modules/data-table/errors/data-table-name-conflict.error");
const data_table_not_found_error_1 = require("../../../modules/data-table/errors/data-table-not-found.error");
const data_table_system_column_name_conflict_error_1 = require("../../../modules/data-table/errors/data-table-system-column-name-conflict.error");
const data_table_validation_error_1 = require("../../../modules/data-table/errors/data-table-validation.error");
const pagination_service_1 = require("../../../public-api/v1/shared/services/pagination.service");
const project_service_ee_1 = require("../../../services/project.service.ee");
const tags = ['DataTable'];
function handleError(error) {
    if (error instanceof data_table_validation_error_1.DataTableValidationError) {
        throw new errors_1.BadRequestError(error.message);
    }
    if (error instanceof project_service_ee_1.ProjectNotFoundError) {
        throw new errors_1.BadRequestError(`Project with ID "${error.projectId}" not found`);
    }
    if (error instanceof data_table_not_found_error_1.DataTableNotFoundError) {
        throw new errors_1.NotFoundError(error.message);
    }
    if (error instanceof data_table_access_denied_error_1.DataTableAccessDeniedError) {
        throw new errors_1.ForbiddenError();
    }
    if (error instanceof data_table_name_conflict_error_1.DataTableNameConflictError ||
        error instanceof data_table_column_name_conflict_error_1.DataTableColumnNameConflictError ||
        error instanceof data_table_system_column_name_conflict_error_1.DataTableSystemColumnNameConflictError) {
        throw new errors_1.ConflictError(error.message);
    }
    throw error;
}
const toDataTablePublicDto = (dataTable, sizeBytes) => ({
    id: dataTable.id,
    name: dataTable.name,
    columns: (dataTable.columns ?? []).map((column) => ({
        id: column.id,
        name: column.name,
        type: column.type,
        index: column.index,
        createdAt: column.createdAt.toISOString(),
        updatedAt: column.updatedAt.toISOString(),
    })),
    projectId: dataTable.projectId,
    createdAt: dataTable.createdAt.toISOString(),
    updatedAt: dataTable.updatedAt.toISOString(),
    sizeBytes,
});
const toDataTableColumnPublicDto = (column) => ({
    id: column.id,
    name: column.name,
    dataTableId: column.dataTableId,
    type: column.type,
    index: column.index,
    createdAt: column.createdAt.toISOString(),
    updatedAt: column.updatedAt.toISOString(),
});
const normalizeRowDates = (row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key,
    value instanceof Date ? value.toISOString() : value,
]));
const toDataTableRowPublic = (row) => {
    const { id, createdAt, updatedAt, ...rest } = row;
    return {
        ...normalizeRowDates(rest),
        id,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
    };
};
const toDataTableRowWithStatePublic = (row) => {
    const { id, createdAt, updatedAt, dryRunState, ...rest } = row;
    return {
        ...normalizeRowDates(rest),
        id,
        createdAt: createdAt?.toISOString() ?? null,
        updatedAt: updatedAt?.toISOString() ?? null,
        dryRunState,
    };
};
const isRowWithId = (row) => !('createdAt' in row);
const isRowWithState = (row) => Object.hasOwn(row, 'dryRunState');
const toMutateRowsResponsePublic = (result) => typeof result === 'boolean'
    ? result
    : result.map((row) => isRowWithState(row) ? toDataTableRowWithStatePublic(row) : toDataTableRowPublic(row));
let DataTablesPublicController = class DataTablesPublicController {
    constructor(dataTableService, dataTableAggregateService) {
        this.dataTableService = dataTableService;
        this.dataTableAggregateService = dataTableAggregateService;
    }
    async listDataTables(req, _res, query) {
        const { offset, limit } = (0, pagination_service_1.resolveOffsetPagination)(query);
        try {
            const { data, count } = await this.dataTableAggregateService.getManyAndCount(req.user, {
                skip: offset,
                take: limit,
                filter: query.filter,
                sortBy: query.sortBy,
            });
            const sizes = await this.dataTableService.getCachedSizeBytesByIds(data.map((dataTable) => dataTable.id));
            return {
                data: data.map((dataTable) => toDataTablePublicDto(dataTable, sizes.get(dataTable.id) ?? 0)),
                nextCursor: (0, pagination_service_1.encodeNextCursor)({ offset, limit, numberOfTotalRecords: count }),
            };
        }
        catch (error) {
            return handleError(error);
        }
    }
    async createDataTable(req, _res, body) {
        try {
            const owningProjectId = await this.dataTableService.resolveOwningProjectId(req.user, body.projectId);
            const dataTable = await this.dataTableService.createDataTable(owningProjectId, {
                name: body.name,
                columns: body.columns,
                fileId: body.fileId,
                hasHeaders: body.hasHeaders,
            });
            return await this.withSize(dataTable);
        }
        catch (error) {
            return handleError(error);
        }
    }
    async getDataTable(_req, _res, dataTableId) {
        try {
            const projectId = await this.dataTableService.getProjectIdForDataTable(dataTableId);
            return await this.withSize(await this.dataTableService.getOne(dataTableId, projectId));
        }
        catch (error) {
            return handleError(error);
        }
    }
    async updateDataTable(_req, _res, dataTableId, body) {
        try {
            const projectId = await this.dataTableService.getProjectIdForDataTable(dataTableId);
            await this.dataTableService.updateDataTable(dataTableId, projectId, { name: body.name });
            return await this.withSize(await this.dataTableService.getOne(dataTableId, projectId));
        }
        catch (error) {
            return handleError(error);
        }
    }
    async deleteDataTable(_req, _res, dataTableId) {
        try {
            const projectId = await this.dataTableService.getProjectIdForDataTable(dataTableId);
            await this.dataTableService.deleteDataTable(dataTableId, projectId);
        }
        catch (error) {
            handleError(error);
        }
    }
    async listDataTableColumns(_req, _res, dataTableId) {
        const projectId = await this.dataTableService.getProjectIdForDataTable(dataTableId);
        const columns = await this.dataTableService.getColumns(dataTableId, projectId);
        return columns.map(toDataTableColumnPublicDto);
    }
    async createDataTableColumn(_req, _res, dataTableId, body) {
        try {
            const projectId = await this.dataTableService.getProjectIdForDataTable(dataTableId);
            const column = await this.dataTableService.addColumn(dataTableId, projectId, body);
            return toDataTableColumnPublicDto(column);
        }
        catch (error) {
            return handleError(error);
        }
    }
    async updateDataTableColumn(_req, _res, dataTableId, columnId, body) {
        const { name, index } = body;
        try {
            const projectId = await this.dataTableService.getProjectIdForDataTable(dataTableId);
            if (name !== undefined) {
                await this.dataTableService.renameColumn(dataTableId, projectId, columnId, { name });
            }
            if (index !== undefined) {
                await this.dataTableService.moveColumn(dataTableId, projectId, columnId, {
                    targetIndex: index,
                });
            }
            const column = await this.dataTableService.getColumnById({
                projectId,
                dataTableId,
                columnId,
            });
            return toDataTableColumnPublicDto(column);
        }
        catch (error) {
            return handleError(error);
        }
    }
    async deleteDataTableColumn(_req, _res, dataTableId, columnId) {
        const projectId = await this.dataTableService.getProjectIdForDataTable(dataTableId);
        await this.dataTableService.deleteColumn(dataTableId, projectId, columnId);
    }
    async listDataTableRows(_req, _res, dataTableId, query) {
        const { offset, limit } = (0, pagination_service_1.resolveOffsetPagination)(query);
        try {
            const projectId = await this.dataTableService.getProjectIdForDataTable(dataTableId);
            const { data, count } = await this.dataTableService.getManyRowsAndCount(dataTableId, projectId, {
                skip: offset,
                take: limit,
                filter: query.filter,
                sortBy: query.sortBy,
                search: query.search,
            });
            return {
                data: data.map(toDataTableRowPublic),
                nextCursor: (0, pagination_service_1.encodeNextCursor)({ offset, limit, numberOfTotalRecords: count }),
            };
        }
        catch (error) {
            return handleError(error);
        }
    }
    async createDataTableRows(_req, _res, dataTableId, body) {
        try {
            const projectId = await this.dataTableService.getProjectIdForDataTable(dataTableId);
            const result = await this.dataTableService.insertRows(dataTableId, projectId, body.data, body.returnType);
            return Array.isArray(result)
                ? result.map((row) => (isRowWithId(row) ? row : toDataTableRowPublic(row)))
                : result;
        }
        catch (error) {
            return handleError(error);
        }
    }
    async upsertDataTableRow(req, _res, dataTableId, body) {
        const { filter, data, returnData, dryRun } = body;
        try {
            await (0, data_table_permissions_1.assertRowReadAccessIfReturningRows)(req.user, dataTableId, { dryRun, returnData });
            const projectId = await this.dataTableService.getProjectIdForDataTable(dataTableId);
            const result = await this.dataTableService.upsertRow(dataTableId, projectId, { filter, data }, returnData, dryRun);
            return toMutateRowsResponsePublic(result);
        }
        catch (error) {
            return handleError(error);
        }
    }
    async updateDataTableRows(req, _res, dataTableId, body) {
        const { filter, data, returnData, dryRun } = body;
        try {
            await (0, data_table_permissions_1.assertRowReadAccessIfReturningRows)(req.user, dataTableId, { dryRun, returnData });
            const projectId = await this.dataTableService.getProjectIdForDataTable(dataTableId);
            const result = await this.dataTableService.updateRows(dataTableId, projectId, { filter, data }, returnData, dryRun);
            return toMutateRowsResponsePublic(result);
        }
        catch (error) {
            return handleError(error);
        }
    }
    async clearDataTableRows(_req, _res, dataTableId) {
        try {
            const projectId = await this.dataTableService.getProjectIdForDataTable(dataTableId);
            return await this.dataTableService.clearRows(dataTableId, projectId);
        }
        catch (error) {
            return handleError(error);
        }
    }
    async deleteDataTableRows(req, _res, dataTableId, query) {
        const { filter, returnData, dryRun } = query;
        try {
            await (0, data_table_permissions_1.assertRowReadAccessIfReturningRows)(req.user, dataTableId, { dryRun, returnData });
            const projectId = await this.dataTableService.getProjectIdForDataTable(dataTableId);
            const result = await this.dataTableService.deleteRows(dataTableId, projectId, { filter }, returnData, dryRun);
            return toMutateRowsResponsePublic(result);
        }
        catch (error) {
            return handleError(error);
        }
    }
    async withSize(dataTable) {
        const sizes = await this.dataTableService.getCachedSizeBytesByIds([dataTable.id]);
        return toDataTablePublicDto(dataTable, sizes.get(dataTable.id) ?? 0);
    }
};
exports.DataTablesPublicController = DataTablesPublicController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.ApiKeyScope)('dataTable:list'),
    (0, decorators_1.ApiSummary)('List all data tables'),
    (0, decorators_1.ApiDescription)('Retrieve a list of all data tables with optional filtering, sorting, and pagination. ' +
        'Each table includes `sizeBytes`, the value the `size` sort option orders by.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.DataTableListPublicDto),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.PublicApiListDataTableQueryDto]),
    __metadata("design:returntype", Promise)
], DataTablesPublicController.prototype, "listDataTables", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.ApiKeyScope)('dataTable:create'),
    (0, decorators_1.ApiSummary)('Create a new data table'),
    (0, decorators_1.ApiDescription)('Create a new data table in your personal project or a team project you have access to.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(201, api_types_1.DataTablePublicDto),
    (0, decorators_1.ApiErrorResponse)(409),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateDataTablePublicDto]),
    __metadata("design:returntype", Promise)
], DataTablesPublicController.prototype, "createDataTable", null);
__decorate([
    (0, decorators_1.Get)('/:dataTableId'),
    (0, decorators_1.ApiKeyScope)('dataTable:read'),
    (0, decorators_1.ProjectScope)('dataTable:read'),
    (0, decorators_1.ApiSummary)('Get a data table'),
    (0, decorators_1.ApiDescription)('Retrieve a specific data table by ID.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.DataTablePublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('dataTableId', api_types_1.dataTableIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], DataTablesPublicController.prototype, "getDataTable", null);
__decorate([
    (0, decorators_1.Patch)('/:dataTableId'),
    (0, decorators_1.ApiKeyScope)('dataTable:update'),
    (0, decorators_1.ProjectScope)('dataTable:update'),
    (0, decorators_1.ApiSummary)('Update a data table'),
    (0, decorators_1.ApiDescription)("Update a data table's name."),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.DataTablePublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    __param(2, (0, decorators_1.Param)('dataTableId', api_types_1.dataTableIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateDataTablePublicDto]),
    __metadata("design:returntype", Promise)
], DataTablesPublicController.prototype, "updateDataTable", null);
__decorate([
    (0, decorators_1.Delete)('/:dataTableId'),
    (0, decorators_1.ApiKeyScope)('dataTable:delete'),
    (0, decorators_1.ProjectScope)('dataTable:delete'),
    (0, decorators_1.ApiSummary)('Delete a data table'),
    (0, decorators_1.ApiDescription)('Delete a data table. This will also delete all rows in the table.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(204),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('dataTableId', api_types_1.dataTableIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], DataTablesPublicController.prototype, "deleteDataTable", null);
__decorate([
    (0, decorators_1.Get)('/:dataTableId/columns'),
    (0, decorators_1.ApiKeyScope)('dataTableColumn:read'),
    (0, decorators_1.ProjectScope)('dataTable:readColumn'),
    (0, decorators_1.ApiSummary)('List columns of a data table'),
    (0, decorators_1.ApiDescription)('Retrieve all columns for a specific data table.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.DataTableColumnListPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('dataTableId', api_types_1.dataTableIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], DataTablesPublicController.prototype, "listDataTableColumns", null);
__decorate([
    (0, decorators_1.Post)('/:dataTableId/columns'),
    (0, decorators_1.ApiKeyScope)('dataTableColumn:create'),
    (0, decorators_1.ProjectScope)('dataTable:writeColumn'),
    (0, decorators_1.ApiSummary)('Add a column to a data table'),
    (0, decorators_1.ApiDescription)('Add a new column to an existing data table.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(201, api_types_1.DataTableColumnPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    __param(2, (0, decorators_1.Param)('dataTableId', api_types_1.dataTableIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.CreateDataTableColumnPublicDto]),
    __metadata("design:returntype", Promise)
], DataTablesPublicController.prototype, "createDataTableColumn", null);
__decorate([
    (0, decorators_1.Patch)('/:dataTableId/columns/:columnId'),
    (0, decorators_1.ApiKeyScope)('dataTableColumn:update'),
    (0, decorators_1.ProjectScope)('dataTable:writeColumn'),
    (0, decorators_1.ApiSummary)('Update a column'),
    (0, decorators_1.ApiDescription)('Rename and/or reorder a column in a data table.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.DataTableColumnPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    __param(2, (0, decorators_1.Param)('dataTableId', api_types_1.dataTableIdParamSchema)),
    __param(3, (0, decorators_1.Param)('columnId', api_types_1.columnIdParamSchema)),
    __param(4, (0, decorators_1.Body)({ required: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.UpdateDataTableColumnPublicDto]),
    __metadata("design:returntype", Promise)
], DataTablesPublicController.prototype, "updateDataTableColumn", null);
__decorate([
    (0, decorators_1.Delete)('/:dataTableId/columns/:columnId'),
    (0, decorators_1.ApiKeyScope)('dataTableColumn:delete'),
    (0, decorators_1.ProjectScope)('dataTable:writeColumn'),
    (0, decorators_1.ApiSummary)('Delete a column'),
    (0, decorators_1.ApiDescription)('Remove a column from a data table. This will also delete all data in the column.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(204),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('dataTableId', api_types_1.dataTableIdParamSchema)),
    __param(3, (0, decorators_1.Param)('columnId', api_types_1.columnIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], DataTablesPublicController.prototype, "deleteDataTableColumn", null);
__decorate([
    (0, decorators_1.Get)('/:dataTableId/rows'),
    (0, decorators_1.ApiKeyScope)('dataTableRow:read'),
    (0, decorators_1.ProjectScope)('dataTable:readRow'),
    (0, decorators_1.ApiSummary)('List rows of a data table'),
    (0, decorators_1.ApiDescription)('Retrieve rows from a data table with optional filtering, sorting, and pagination.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.DataTableRowListPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('dataTableId', api_types_1.dataTableIdParamSchema)),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.PublicApiListDataTableRowsQueryDto]),
    __metadata("design:returntype", Promise)
], DataTablesPublicController.prototype, "listDataTableRows", null);
__decorate([
    (0, decorators_1.Post)('/:dataTableId/rows'),
    (0, decorators_1.ApiKeyScope)('dataTableRow:create'),
    (0, decorators_1.ProjectScope)('dataTable:writeRow'),
    (0, decorators_1.ApiSummary)('Insert rows into a data table'),
    (0, decorators_1.ApiDescription)('Insert one or more rows into a data table.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.InsertDataTableRowsResponsePublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('dataTableId', api_types_1.dataTableIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.CreateDataTableRowsPublicDto]),
    __metadata("design:returntype", Promise)
], DataTablesPublicController.prototype, "createDataTableRows", null);
__decorate([
    (0, decorators_1.Post)('/:dataTableId/rows/upsert'),
    (0, decorators_1.ApiKeyScope)('dataTableRow:upsert'),
    (0, decorators_1.ProjectScope)('dataTable:writeRow'),
    (0, decorators_1.ApiSummary)('Upsert a row in a data table'),
    (0, decorators_1.ApiDescription)('Update an existing row, or insert a new one if no row matches the filter conditions.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.UpsertDataTableRowResponsePublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('dataTableId', api_types_1.dataTableIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpsertDataTableRowPublicDto]),
    __metadata("design:returntype", Promise)
], DataTablesPublicController.prototype, "upsertDataTableRow", null);
__decorate([
    (0, decorators_1.Patch)('/:dataTableId/rows/update'),
    (0, decorators_1.ApiKeyScope)('dataTableRow:update'),
    (0, decorators_1.ProjectScope)('dataTable:writeRow'),
    (0, decorators_1.ApiSummary)('Update rows in a data table'),
    (0, decorators_1.ApiDescription)('Update rows matching filter conditions in a data table.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.UpdateDataTableRowResponsePublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('dataTableId', api_types_1.dataTableIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateDataTableRowPublicDto]),
    __metadata("design:returntype", Promise)
], DataTablesPublicController.prototype, "updateDataTableRows", null);
__decorate([
    (0, decorators_1.Delete)('/:dataTableId/rows/clear'),
    (0, decorators_1.ApiKeyScope)('dataTableRow:delete'),
    (0, decorators_1.ProjectScope)('dataTable:writeRow'),
    (0, decorators_1.ApiSummary)('Clear all rows from a data table'),
    (0, decorators_1.ApiDescription)('Permanently delete all rows from a data table. The table structure is retained. This ' +
        'action cannot be undone.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.ClearDataTableRowsResponsePublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('dataTableId', api_types_1.dataTableIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], DataTablesPublicController.prototype, "clearDataTableRows", null);
__decorate([
    (0, decorators_1.Delete)('/:dataTableId/rows/delete'),
    (0, decorators_1.ApiKeyScope)('dataTableRow:delete'),
    (0, decorators_1.ProjectScope)('dataTable:writeRow'),
    (0, decorators_1.ApiSummary)('Delete rows from a data table'),
    (0, decorators_1.ApiDescription)('Delete rows matching filter conditions from a data table. Filter is required to prevent ' +
        'accidental deletion of all data.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.DeleteDataTableRowsResponsePublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('dataTableId', api_types_1.dataTableIdParamSchema)),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.DeleteDataTableRowsPublicQueryDto]),
    __metadata("design:returntype", Promise)
], DataTablesPublicController.prototype, "deleteDataTableRows", null);
exports.DataTablesPublicController = DataTablesPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/data-tables'),
    __metadata("design:paramtypes", [data_table_service_1.DataTableService, data_table_aggregate_service_1.DataTableAggregateService])
], DataTablesPublicController);
//# sourceMappingURL=data-tables.public.controller.js.map