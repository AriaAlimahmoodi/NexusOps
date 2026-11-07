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
exports.DataTableController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const backend_services_1 = require("@n8n/backend-services");
const project_service_ee_1 = require("../../services/project.service.ee");
const data_table_permissions_1 = require("./data-table-permissions");
const data_table_service_1 = require("./data-table.service");
const data_table_column_name_conflict_error_1 = require("./errors/data-table-column-name-conflict.error");
const data_table_file_upload_error_1 = require("./errors/data-table-file-upload.error");
const data_table_name_conflict_error_1 = require("./errors/data-table-name-conflict.error");
const data_table_not_found_error_1 = require("./errors/data-table-not-found.error");
const data_table_system_column_name_conflict_error_1 = require("./errors/data-table-system-column-name-conflict.error");
const data_table_validation_error_1 = require("./errors/data-table-validation.error");
let DataTableController = class DataTableController {
    constructor(dataTableService, projectService, instanceWriteAccess) {
        this.dataTableService = dataTableService;
        this.projectService = projectService;
        this.instanceWriteAccess = instanceWriteAccess;
    }
    handleDataTableColumnOperationError(e) {
        if (e instanceof data_table_column_name_conflict_error_1.DataTableColumnNameConflictError ||
            e instanceof data_table_system_column_name_conflict_error_1.DataTableSystemColumnNameConflictError ||
            e instanceof data_table_name_conflict_error_1.DataTableNameConflictError) {
            throw new errors_1.ConflictError(e.message);
        }
        if (e instanceof data_table_validation_error_1.DataTableValidationError) {
            throw new errors_1.BadRequestError(e.message);
        }
        if (e instanceof errors_1.ResponseError) {
            throw e;
        }
        if (e instanceof Error) {
            throw new errors_1.InternalServerError(e.message, e);
        }
        throw e;
    }
    async validateProjectExists(req, res, next) {
        try {
            const { projectId } = req.params;
            await this.projectService.getProject(projectId);
            next();
        }
        catch (e) {
            res.status(404).send('Project not found');
            return;
        }
    }
    async createDataTable(req, _res, dto) {
        (0, data_table_permissions_1.assertSchemaWriteAccess)(this.instanceWriteAccess);
        try {
            return await this.dataTableService.createDataTable(req.params.projectId, dto);
        }
        catch (e) {
            if (!(e instanceof Error)) {
                throw e;
            }
            else if (e instanceof data_table_name_conflict_error_1.DataTableNameConflictError ||
                e instanceof data_table_system_column_name_conflict_error_1.DataTableSystemColumnNameConflictError) {
                throw new errors_1.ConflictError(e.message);
            }
            else if (e instanceof data_table_validation_error_1.DataTableValidationError) {
                throw new errors_1.BadRequestError(e.message);
            }
            else if (e instanceof data_table_file_upload_error_1.FileUploadError) {
                throw new errors_1.BadRequestError(e.message);
            }
            else {
                throw new errors_1.InternalServerError(e.message, e);
            }
        }
    }
    async listProjectDataTables(req, _res, payload) {
        const providedFilter = payload?.filter ?? {};
        return await this.dataTableService.getManyAndCount({
            ...payload,
            filter: { ...providedFilter, projectId: req.params.projectId },
        });
    }
    async updateDataTable(req, _res, dataTableId, dto) {
        (0, data_table_permissions_1.assertSchemaWriteAccess)(this.instanceWriteAccess);
        try {
            return await this.dataTableService.updateDataTable(dataTableId, req.params.projectId, dto);
        }
        catch (e) {
            if (e instanceof data_table_not_found_error_1.DataTableNotFoundError) {
                throw new errors_1.NotFoundError(e.message);
            }
            else if (e instanceof data_table_name_conflict_error_1.DataTableNameConflictError) {
                throw new errors_1.ConflictError(e.message);
            }
            else if (e instanceof Error) {
                throw new errors_1.InternalServerError(e.message, e);
            }
            else {
                throw e;
            }
        }
    }
    async deleteDataTable(req, _res, dataTableId) {
        (0, data_table_permissions_1.assertSchemaWriteAccess)(this.instanceWriteAccess);
        try {
            return await this.dataTableService.deleteDataTable(dataTableId, req.params.projectId);
        }
        catch (e) {
            if (e instanceof data_table_not_found_error_1.DataTableNotFoundError) {
                throw new errors_1.NotFoundError(e.message);
            }
            else if (e instanceof Error) {
                throw new errors_1.InternalServerError(e.message, e);
            }
            else {
                throw e;
            }
        }
    }
    async getColumns(req, _res, dataTableId) {
        try {
            return await this.dataTableService.getColumns(dataTableId, req.params.projectId);
        }
        catch (e) {
            if (e instanceof data_table_not_found_error_1.DataTableNotFoundError) {
                throw new errors_1.NotFoundError(e.message);
            }
            else if (e instanceof Error) {
                throw new errors_1.InternalServerError(e.message, e);
            }
            else {
                throw e;
            }
        }
    }
    async addColumn(req, _res, dataTableId, dto) {
        (0, data_table_permissions_1.assertSchemaWriteAccess)(this.instanceWriteAccess);
        try {
            return await this.dataTableService.addColumn(dataTableId, req.params.projectId, dto);
        }
        catch (e) {
            this.handleDataTableColumnOperationError(e);
        }
    }
    async deleteColumn(req, _res, dataTableId, columnId) {
        (0, data_table_permissions_1.assertSchemaWriteAccess)(this.instanceWriteAccess);
        try {
            return await this.dataTableService.deleteColumn(dataTableId, req.params.projectId, columnId);
        }
        catch (e) {
            this.handleDataTableColumnOperationError(e);
        }
    }
    async moveColumn(req, _res, dataTableId, columnId, dto) {
        (0, data_table_permissions_1.assertSchemaWriteAccess)(this.instanceWriteAccess);
        try {
            return await this.dataTableService.moveColumn(dataTableId, req.params.projectId, columnId, dto);
        }
        catch (e) {
            this.handleDataTableColumnOperationError(e);
        }
    }
    async renameColumn(req, _res, dataTableId, columnId, dto) {
        (0, data_table_permissions_1.assertSchemaWriteAccess)(this.instanceWriteAccess);
        try {
            return await this.dataTableService.renameColumn(dataTableId, req.params.projectId, columnId, dto);
        }
        catch (e) {
            this.handleDataTableColumnOperationError(e);
        }
    }
    async getDataTableRows(req, _res, dataTableId, dto) {
        try {
            return await this.dataTableService.getManyRowsAndCount(dataTableId, req.params.projectId, dto);
        }
        catch (e) {
            if (e instanceof data_table_not_found_error_1.DataTableNotFoundError) {
                throw new errors_1.NotFoundError(e.message);
            }
            else if (e instanceof Error) {
                throw new errors_1.InternalServerError(e.message, e);
            }
            else {
                throw e;
            }
        }
    }
    async downloadDataTableCsv(req, _res, query) {
        try {
            const { projectId, dataTableId } = req.params;
            const { csvContent, dataTableName } = await this.dataTableService.generateDataTableCsv(dataTableId, projectId, query.includeSystemColumns);
            return {
                csvContent,
                dataTableName,
            };
        }
        catch (e) {
            if (e instanceof data_table_not_found_error_1.DataTableNotFoundError) {
                throw new errors_1.NotFoundError(e.message);
            }
            else if (e instanceof Error) {
                throw new errors_1.InternalServerError(e.message, e);
            }
            else {
                throw e;
            }
        }
    }
    async appendDataTableRows(req, _res, dataTableId, dto) {
        try {
            return await this.dataTableService.insertRows(dataTableId, req.params.projectId, dto.data, dto.returnType);
        }
        catch (e) {
            if (e instanceof data_table_not_found_error_1.DataTableNotFoundError) {
                throw new errors_1.NotFoundError(e.message);
            }
            else if (e instanceof data_table_validation_error_1.DataTableValidationError) {
                throw new errors_1.BadRequestError(e.message);
            }
            else if (e instanceof Error) {
                throw new errors_1.InternalServerError(e.message, e);
            }
            else {
                throw e;
            }
        }
    }
    async importCsvToDataTable(req, _res, dataTableId, dto) {
        try {
            return await this.dataTableService.importCsvToExistingTable(dataTableId, req.params.projectId, dto.fileId);
        }
        catch (e) {
            if (e instanceof data_table_not_found_error_1.DataTableNotFoundError) {
                throw new errors_1.NotFoundError(e.message);
            }
            else if (e instanceof data_table_validation_error_1.DataTableValidationError) {
                throw new errors_1.BadRequestError(e.message);
            }
            else if (e instanceof data_table_file_upload_error_1.FileUploadError) {
                throw new errors_1.BadRequestError(e.message);
            }
            else if (e instanceof Error) {
                throw new errors_1.InternalServerError(e.message, e);
            }
            else {
                throw e;
            }
        }
    }
    async upsertDataTableRow(req, _res, dataTableId, dto) {
        await (0, data_table_permissions_1.assertRowReadAccessIfReturningRows)(req.user, dataTableId, dto);
        try {
            return await this.dataTableService.upsertRow(dataTableId, req.params.projectId, dto, dto.returnData, dto.dryRun);
        }
        catch (e) {
            if (e instanceof data_table_not_found_error_1.DataTableNotFoundError) {
                throw new errors_1.NotFoundError(e.message);
            }
            else if (e instanceof data_table_validation_error_1.DataTableValidationError) {
                throw new errors_1.BadRequestError(e.message);
            }
            else if (e instanceof Error) {
                throw new errors_1.InternalServerError(e.message, e);
            }
            else {
                throw e;
            }
        }
    }
    async updateDataTableRows(req, _res, dataTableId, dto) {
        await (0, data_table_permissions_1.assertRowReadAccessIfReturningRows)(req.user, dataTableId, dto);
        try {
            return await this.dataTableService.updateRows(dataTableId, req.params.projectId, dto, dto.returnData, dto.dryRun);
        }
        catch (e) {
            if (e instanceof data_table_not_found_error_1.DataTableNotFoundError) {
                throw new errors_1.NotFoundError(e.message);
            }
            else if (e instanceof data_table_validation_error_1.DataTableValidationError) {
                throw new errors_1.BadRequestError(e.message);
            }
            else if (e instanceof Error) {
                throw new errors_1.InternalServerError(e.message, e);
            }
            else {
                throw e;
            }
        }
    }
    async deleteDataTableRows(req, _res, dataTableId, dto) {
        await (0, data_table_permissions_1.assertRowReadAccessIfReturningRows)(req.user, dataTableId, dto);
        try {
            return await this.dataTableService.deleteRows(dataTableId, req.params.projectId, dto, dto.returnData, dto.dryRun);
        }
        catch (e) {
            if (e instanceof data_table_not_found_error_1.DataTableNotFoundError) {
                throw new errors_1.NotFoundError(e.message);
            }
            else if (e instanceof data_table_validation_error_1.DataTableValidationError) {
                throw new errors_1.BadRequestError(e.message);
            }
            else if (e instanceof Error) {
                throw new errors_1.InternalServerError(e.message, e);
            }
            else {
                throw e;
            }
        }
    }
};
exports.DataTableController = DataTableController;
__decorate([
    (0, decorators_1.Middleware)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Function]),
    __metadata("design:returntype", Promise)
], DataTableController.prototype, "validateProjectExists", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.ProjectScope)('dataTable:create'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateDataTableDto]),
    __metadata("design:returntype", Promise)
], DataTableController.prototype, "createDataTable", null);
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.ProjectScope)('dataTable:listProject'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListDataTableQueryDto]),
    __metadata("design:returntype", Promise)
], DataTableController.prototype, "listProjectDataTables", null);
__decorate([
    (0, decorators_1.Patch)('/:dataTableId'),
    (0, decorators_1.ProjectScope)('dataTable:update'),
    __param(2, (0, decorators_1.Param)('dataTableId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateDataTableDto]),
    __metadata("design:returntype", Promise)
], DataTableController.prototype, "updateDataTable", null);
__decorate([
    (0, decorators_1.Delete)('/:dataTableId'),
    (0, decorators_1.ProjectScope)('dataTable:delete'),
    __param(2, (0, decorators_1.Param)('dataTableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], DataTableController.prototype, "deleteDataTable", null);
__decorate([
    (0, decorators_1.Get)('/:dataTableId/columns'),
    (0, decorators_1.ProjectScope)('dataTable:read'),
    __param(2, (0, decorators_1.Param)('dataTableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], DataTableController.prototype, "getColumns", null);
__decorate([
    (0, decorators_1.Post)('/:dataTableId/columns'),
    (0, decorators_1.ProjectScope)('dataTable:update'),
    __param(2, (0, decorators_1.Param)('dataTableId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.AddDataTableColumnDto]),
    __metadata("design:returntype", Promise)
], DataTableController.prototype, "addColumn", null);
__decorate([
    (0, decorators_1.Delete)('/:dataTableId/columns/:columnId'),
    (0, decorators_1.ProjectScope)('dataTable:update'),
    __param(2, (0, decorators_1.Param)('dataTableId')),
    __param(3, (0, decorators_1.Param)('columnId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], DataTableController.prototype, "deleteColumn", null);
__decorate([
    (0, decorators_1.Patch)('/:dataTableId/columns/:columnId/move'),
    (0, decorators_1.ProjectScope)('dataTable:update'),
    __param(2, (0, decorators_1.Param)('dataTableId')),
    __param(3, (0, decorators_1.Param)('columnId')),
    __param(4, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.MoveDataTableColumnDto]),
    __metadata("design:returntype", Promise)
], DataTableController.prototype, "moveColumn", null);
__decorate([
    (0, decorators_1.Patch)('/:dataTableId/columns/:columnId/rename'),
    (0, decorators_1.ProjectScope)('dataTable:update'),
    __param(2, (0, decorators_1.Param)('dataTableId')),
    __param(3, (0, decorators_1.Param)('columnId')),
    __param(4, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.RenameDataTableColumnDto]),
    __metadata("design:returntype", Promise)
], DataTableController.prototype, "renameColumn", null);
__decorate([
    (0, decorators_1.Get)('/:dataTableId/rows'),
    (0, decorators_1.ProjectScope)('dataTable:readRow'),
    __param(2, (0, decorators_1.Param)('dataTableId')),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ListDataTableContentQueryDto]),
    __metadata("design:returntype", Promise)
], DataTableController.prototype, "getDataTableRows", null);
__decorate([
    (0, decorators_1.Get)('/:dataTableId/download-csv'),
    (0, decorators_1.ProjectScope)('dataTable:readRow'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.DownloadDataTableCsvQueryDto]),
    __metadata("design:returntype", Promise)
], DataTableController.prototype, "downloadDataTableCsv", null);
__decorate([
    (0, decorators_1.Post)('/:dataTableId/insert'),
    (0, decorators_1.ProjectScope)('dataTable:writeRow'),
    __param(2, (0, decorators_1.Param)('dataTableId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.AddDataTableRowsDto]),
    __metadata("design:returntype", Promise)
], DataTableController.prototype, "appendDataTableRows", null);
__decorate([
    (0, decorators_1.Post)('/:dataTableId/import-csv'),
    (0, decorators_1.ProjectScope)('dataTable:writeRow'),
    __param(2, (0, decorators_1.Param)('dataTableId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ImportCsvToDataTableDto]),
    __metadata("design:returntype", Promise)
], DataTableController.prototype, "importCsvToDataTable", null);
__decorate([
    (0, decorators_1.Post)('/:dataTableId/upsert'),
    (0, decorators_1.ProjectScope)('dataTable:writeRow'),
    __param(2, (0, decorators_1.Param)('dataTableId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpsertDataTableRowDto]),
    __metadata("design:returntype", Promise)
], DataTableController.prototype, "upsertDataTableRow", null);
__decorate([
    (0, decorators_1.Patch)('/:dataTableId/rows'),
    (0, decorators_1.ProjectScope)('dataTable:writeRow'),
    __param(2, (0, decorators_1.Param)('dataTableId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateDataTableRowDto]),
    __metadata("design:returntype", Promise)
], DataTableController.prototype, "updateDataTableRows", null);
__decorate([
    (0, decorators_1.Delete)('/:dataTableId/rows'),
    (0, decorators_1.ProjectScope)('dataTable:writeRow'),
    __param(2, (0, decorators_1.Param)('dataTableId')),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.DeleteDataTableRowsDto]),
    __metadata("design:returntype", Promise)
], DataTableController.prototype, "deleteDataTableRows", null);
exports.DataTableController = DataTableController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/data-tables'),
    __metadata("design:paramtypes", [data_table_service_1.DataTableService, project_service_ee_1.ProjectService, backend_services_1.InstanceWriteAccessService])
], DataTableController);
//# sourceMappingURL=data-table.controller.js.map