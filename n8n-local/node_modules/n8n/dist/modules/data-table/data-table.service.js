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
exports.DataTableService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const data_table_column_repository_1 = require("./data-table-column.repository");
const data_table_csv_import_service_1 = require("./data-table-csv-import.service");
const data_table_rows_repository_1 = require("./data-table-rows.repository");
const data_table_size_validator_service_1 = require("./data-table-size-validator.service");
const data_table_repository_1 = require("./data-table.repository");
const data_table_types_1 = require("./data-table.types");
const data_table_access_denied_error_1 = require("./errors/data-table-access-denied.error");
const data_table_column_not_found_error_1 = require("./errors/data-table-column-not-found.error");
const data_table_name_conflict_error_1 = require("./errors/data-table-name-conflict.error");
const data_table_not_found_error_1 = require("./errors/data-table-not-found.error");
const data_table_validation_error_1 = require("./errors/data-table-validation.error");
const sql_utils_1 = require("./utils/sql-utils");
const project_service_ee_1 = require("../../services/project.service.ee");
let DataTableService = class DataTableService {
    constructor(dataTableRepository, dataTableColumnRepository, dataTableRowsRepository, logger, dataTableSizeValidator, projectRelationRepository, roleService, csvImportService, eventService, projectRepository, projectService) {
        this.dataTableRepository = dataTableRepository;
        this.dataTableColumnRepository = dataTableColumnRepository;
        this.dataTableRowsRepository = dataTableRowsRepository;
        this.logger = logger;
        this.dataTableSizeValidator = dataTableSizeValidator;
        this.projectRelationRepository = projectRelationRepository;
        this.roleService = roleService;
        this.csvImportService = csvImportService;
        this.eventService = eventService;
        this.projectRepository = projectRepository;
        this.projectService = projectService;
        this.logger = this.logger.scoped('data-table');
    }
    async start() { }
    async shutdown() { }
    async getProjectIdForDataTable(dataTableId) {
        const dataTable = await this.dataTableRepository.findOne({
            select: ['projectId'],
            where: { id: dataTableId },
        });
        if (!dataTable) {
            throw new data_table_not_found_error_1.DataTableNotFoundError(dataTableId);
        }
        return dataTable.projectId;
    }
    async getOne(dataTableId, projectId) {
        const dataTable = await this.dataTableRepository.findOne({
            where: { id: dataTableId, project: { id: projectId } },
            relations: ['project', 'columns'],
        });
        if (!dataTable) {
            throw new data_table_not_found_error_1.DataTableNotFoundError(dataTableId);
        }
        return dataTable;
    }
    async resolveOwningProjectId(user, projectId) {
        if (!projectId) {
            const personalProject = await this.projectRepository.getPersonalProjectForUserOrFail(user.id);
            return personalProject.id;
        }
        const existingProject = await this.projectService.findProject(projectId);
        if (!existingProject) {
            throw new project_service_ee_1.ProjectNotFoundError(projectId);
        }
        const project = await this.projectService.getProjectWithScope(user, projectId, [
            'dataTable:create',
        ]);
        if (!project)
            throw new data_table_access_denied_error_1.DataTableAccessDeniedError('create');
        return project.id;
    }
    async createDataTable(projectId, dto, id, columnIds) {
        if (dto.fileId && dto.columns.length === 0) {
            throw new data_table_validation_error_1.DataTableValidationError('At least one column must be included when importing from CSV');
        }
        await this.validateUniqueName(dto.name, projectId);
        const result = await this.dataTableRepository.createDataTable(projectId, dto.name, dto.columns, undefined, id, columnIds);
        if (dto.fileId) {
            try {
                const tableColumns = await this.getColumns(result.id, projectId);
                const rows = await this.csvImportService.buildRowsForNewTable(dto.fileId, dto.hasHeaders ?? true, tableColumns, dto.columns);
                if (rows.length > 0) {
                    await this.insertRows(result.id, projectId, rows);
                }
            }
            catch (error) {
                await this.deleteDataTable(result.id, projectId);
                throw error;
            }
            finally {
                await this.csvImportService.cleanupFile(dto.fileId);
            }
        }
        this.dataTableSizeValidator.reset();
        return result;
    }
    async findDataTablesByIds(dataTableIds) {
        if (dataTableIds.length === 0)
            return [];
        return await this.dataTableRepository.find({
            where: { id: (0, typeorm_1.In)(dataTableIds) },
            relations: { columns: true },
        });
    }
    async findTableIdsByColumnIds(columnIds) {
        return await this.dataTableColumnRepository.findTableIdsByColumnIds(columnIds);
    }
    async findDataTablesByNamesInProject(projectId, names) {
        if (names.length === 0)
            return [];
        return await this.dataTableRepository.find({
            select: ['id', 'name'],
            where: { projectId, name: (0, typeorm_1.In)(names) },
        });
    }
    async importCsvToExistingTable(dataTableId, projectId, fileId) {
        await this.validateDataTableSize();
        await this.validateDataTableExists(dataTableId, projectId);
        try {
            const tableColumns = await this.getColumns(dataTableId, projectId);
            const { rows, systemColumnsIgnored } = await this.csvImportService.validateAndBuildRowsForExistingTable(fileId, tableColumns);
            if (rows.length > 0) {
                await this.insertRows(dataTableId, projectId, rows);
            }
            return {
                importedRowCount: rows.length,
                systemColumnsIgnored,
            };
        }
        finally {
            await this.csvImportService.cleanupFile(fileId);
        }
    }
    async updateDataTable(dataTableId, projectId, dto) {
        await this.validateDataTableExists(dataTableId, projectId);
        await this.validateUniqueName(dto.name, projectId);
        await this.dataTableRepository.update({ id: dataTableId }, { name: dto.name });
        return true;
    }
    async transferDataTablesByProjectId(fromProjectId, toProjectId, trx) {
        return await this.dataTableRepository.transferDataTableByProjectId(fromProjectId, toProjectId, trx);
    }
    async deleteDataTableByProjectId(projectId) {
        const tables = await this.dataTableRepository.findBy({ projectId });
        const result = await this.dataTableRepository.deleteDataTableByProjectId(projectId);
        if (result) {
            for (const table of tables) {
                this.eventService.emit('data-table-deleted', { dataTableId: table.id, projectId });
            }
            this.dataTableSizeValidator.reset();
        }
        return result;
    }
    async deleteDataTableAll() {
        const result = await this.dataTableRepository.deleteDataTableAll();
        if (result) {
            this.dataTableSizeValidator.reset();
        }
        return result;
    }
    async deleteDataTable(dataTableId, projectId) {
        await this.validateDataTableExists(dataTableId, projectId);
        await this.dataTableRepository.deleteDataTable(dataTableId);
        this.eventService.emit('data-table-deleted', { dataTableId, projectId });
        this.dataTableSizeValidator.reset();
        return true;
    }
    async addColumn(dataTableId, projectId, dto) {
        await this.validateDataTableExists(dataTableId, projectId);
        const result = await this.dataTableColumnRepository.addColumn(dataTableId, dto);
        await this.dataTableRepository.touchUpdatedAt(dataTableId);
        return result;
    }
    async replaceSchema(dataTableId, projectId, schema) {
        const table = await this.validateDataTableExists(dataTableId, projectId);
        if (table.name !== schema.name)
            await this.validateUniqueName(schema.name, projectId);
        await this.dataTableColumnRepository.replaceSchema(dataTableId, projectId, schema);
    }
    async moveColumn(dataTableId, projectId, columnId, dto) {
        await this.validateDataTableExists(dataTableId, projectId);
        const existingColumn = await this.validateColumnExists(dataTableId, columnId);
        await this.dataTableColumnRepository.moveColumn(dataTableId, existingColumn, dto.targetIndex);
        return true;
    }
    async deleteColumn(dataTableId, projectId, columnId) {
        await this.validateDataTableExists(dataTableId, projectId);
        const existingColumn = await this.validateColumnExists(dataTableId, columnId);
        await this.dataTableColumnRepository.deleteColumn(dataTableId, existingColumn);
        await this.dataTableRepository.touchUpdatedAt(dataTableId);
        return true;
    }
    async renameColumn(dataTableId, projectId, columnId, dto) {
        await this.validateDataTableExists(dataTableId, projectId);
        const existingColumn = await this.validateColumnExists(dataTableId, columnId);
        return await this.dataTableColumnRepository.renameColumn(dataTableId, existingColumn, dto.name);
    }
    async getManyAndCount(options) {
        return await this.dataTableRepository.getManyAndCount(options);
    }
    async getManyRowsAndCount(dataTableId, projectId, dto) {
        await this.validateDataTableExists(dataTableId, projectId);
        return await this.dataTableColumnRepository.manager.transaction(async (em) => {
            const columns = await this.dataTableColumnRepository.getColumns(dataTableId, em);
            const sortColumn = dto.sortBy?.[0];
            if (sortColumn &&
                !Object.hasOwn(n8n_workflow_1.DATA_TABLE_SYSTEM_COLUMN_TYPE_MAP, sortColumn) &&
                !columns.some((column) => column.name === sortColumn)) {
                throw new data_table_validation_error_1.DataTableValidationError(`unknown column name '${sortColumn}'`);
            }
            const transformedDto = dto.filter
                ? { ...dto, filter: this.validateAndTransformFilters(dto.filter, columns) }
                : dto;
            const result = await this.dataTableRowsRepository.getManyAndCount(dataTableId, transformedDto, columns, em);
            return {
                count: result.count,
                data: (0, sql_utils_1.normalizeRows)(result.data, columns),
            };
        });
    }
    async getColumns(dataTableId, projectId) {
        await this.validateDataTableExists(dataTableId, projectId);
        return await this.dataTableColumnRepository.getColumns(dataTableId);
    }
    async getColumnById({ projectId, dataTableId, columnId, }) {
        await this.validateDataTableExists(dataTableId, projectId);
        return await this.dataTableColumnRepository.getColumnByIdOrFail(dataTableId, columnId);
    }
    async insertRows(dataTableId, projectId, rows, returnType = 'count') {
        await this.validateDataTableSize();
        await this.validateDataTableExists(dataTableId, projectId);
        const result = await this.dataTableColumnRepository.manager.transaction(async (trx) => {
            const columns = await this.dataTableColumnRepository.getColumns(dataTableId, trx);
            const transformedRows = this.validateAndTransformRows(rows, columns);
            return await this.dataTableRowsRepository.insertRows(dataTableId, transformedRows, columns, returnType, trx);
        });
        this.dataTableSizeValidator.reset();
        await this.dataTableRepository.touchUpdatedAt(dataTableId);
        return result;
    }
    async upsertRow(dataTableId, projectId, dto, returnData = false, dryRun = false) {
        await this.validateDataTableSize();
        await this.validateDataTableExists(dataTableId, projectId);
        const result = await this.dataTableColumnRepository.manager.transaction(async (trx) => {
            const columns = await this.dataTableColumnRepository.getColumns(dataTableId, trx);
            const { data, filter } = this.validateAndTransformUpdateParams(dto, columns);
            if (dryRun) {
                return await this.dataTableRowsRepository.dryRunUpsertRow(dataTableId, data, filter, columns, trx);
            }
            const updated = await this.dataTableRowsRepository.updateRows(dataTableId, data, filter, columns, true, trx);
            if (updated.length > 0) {
                return returnData ? updated : true;
            }
            const inserted = await this.dataTableRowsRepository.insertRows(dataTableId, [data], columns, returnData ? 'all' : 'id', trx);
            return returnData ? inserted : true;
        });
        if (!dryRun) {
            this.dataTableSizeValidator.reset();
            await this.dataTableRepository.touchUpdatedAt(dataTableId);
        }
        return result;
    }
    validateAndTransformUpdateParams({ filter, data }, columns) {
        if (columns.length === 0) {
            throw new data_table_validation_error_1.DataTableValidationError('No columns found for this data table or data table not found');
        }
        if (!filter?.filters || filter.filters.length === 0) {
            throw new data_table_validation_error_1.DataTableValidationError('Filter must not be empty');
        }
        if (!data || Object.keys(data).length === 0) {
            throw new data_table_validation_error_1.DataTableValidationError('Data columns must not be empty');
        }
        const [transformedData] = this.validateAndTransformRows([data], columns, false);
        const transformedFilter = this.validateAndTransformFilters(filter, columns);
        return { data: transformedData, filter: transformedFilter };
    }
    async updateRows(dataTableId, projectId, dto, returnData = false, dryRun = false) {
        await this.validateDataTableSize();
        await this.validateDataTableExists(dataTableId, projectId);
        const result = await this.dataTableColumnRepository.manager.transaction(async (trx) => {
            const columns = await this.dataTableColumnRepository.getColumns(dataTableId, trx);
            const { data, filter } = this.validateAndTransformUpdateParams(dto, columns);
            if (dryRun) {
                return await this.dataTableRowsRepository.dryRunUpdateRows(dataTableId, data, filter, columns, trx);
            }
            return await this.dataTableRowsRepository.updateRows(dataTableId, data, filter, columns, returnData, trx);
        });
        if (!dryRun) {
            this.dataTableSizeValidator.reset();
            await this.dataTableRepository.touchUpdatedAt(dataTableId);
        }
        return result;
    }
    async deleteRows(dataTableId, projectId, dto, returnData = false, dryRun = false) {
        await this.validateDataTableExists(dataTableId, projectId);
        const result = await this.dataTableColumnRepository.manager.transaction(async (trx) => {
            const columns = await this.dataTableColumnRepository.getColumns(dataTableId, trx);
            if (!dto.filter?.filters || dto.filter.filters.length === 0) {
                throw new data_table_validation_error_1.DataTableValidationError('Filter is required for delete operations to prevent accidental deletion of all data');
            }
            const transformedFilter = this.validateAndTransformFilters(dto.filter, columns);
            return await this.dataTableRowsRepository.deleteRows(dataTableId, columns, transformedFilter, returnData, dryRun, trx);
        });
        if (!dryRun) {
            this.dataTableSizeValidator.reset();
            await this.dataTableRepository.touchUpdatedAt(dataTableId);
        }
        return result;
    }
    async clearRows(dataTableId, projectId) {
        await this.validateDataTableExists(dataTableId, projectId);
        const result = await this.dataTableColumnRepository.manager.transaction(async (trx) => {
            const clearResult = await this.dataTableRowsRepository.clearRows(dataTableId, trx);
            await this.dataTableRepository.touchUpdatedAt(dataTableId, trx);
            return clearResult;
        });
        this.dataTableSizeValidator.reset();
        return result;
    }
    validateAndTransformRows(rows, columns, includeSystemColumns = false, skipDateTransform = false) {
        const allColumns = includeSystemColumns
            ? [
                ...Object.entries(n8n_workflow_1.DATA_TABLE_SYSTEM_COLUMN_TYPE_MAP).map(([name, type]) => ({
                    name,
                    type,
                })),
                ...columns,
            ]
            : columns;
        const columnNames = new Set(allColumns.map((x) => x.name));
        const columnTypeMap = new Map(allColumns.map((x) => [x.name, x.type]));
        return rows.map((row) => {
            const transformedRow = {};
            const keys = Object.keys(row);
            for (const key of keys) {
                if (!columnNames.has(key)) {
                    throw new data_table_validation_error_1.DataTableValidationError(`unknown column name '${key}'`);
                }
                transformedRow[key] = this.validateAndTransformCell(row[key], key, columnTypeMap, skipDateTransform);
            }
            return transformedRow;
        });
    }
    validateAndTransformCell(cell, key, columnTypeMap, skipDateTransform = false) {
        if (cell === null)
            return null;
        const columnType = columnTypeMap.get(key);
        if (!columnType)
            return cell;
        const fieldType = data_table_types_1.columnTypeToFieldType[columnType];
        if (!fieldType)
            return cell;
        const validationResult = (0, n8n_workflow_1.validateFieldType)(key, cell, fieldType, {
            strict: false,
            parseStrings: false,
        });
        if (!validationResult.valid) {
            throw new data_table_validation_error_1.DataTableValidationError(`value '${String(cell)}' does not match column type '${columnType}': ${validationResult.errorMessage}`);
        }
        if (columnType === 'date') {
            if (skipDateTransform && cell instanceof Date) {
                return cell;
            }
            try {
                const dateInISO = validationResult.newValue.toUTC().toISO();
                return dateInISO;
            }
            catch {
                throw new data_table_validation_error_1.DataTableValidationError(`value '${String(cell)}' does not match column type 'date'`);
            }
        }
        return validationResult.newValue;
    }
    async validateDataTableExists(dataTableId, projectId) {
        const existingTable = await this.dataTableRepository.findOneBy({
            id: dataTableId,
            project: {
                id: projectId,
            },
        });
        if (!existingTable) {
            throw new data_table_not_found_error_1.DataTableNotFoundError(dataTableId);
        }
        return existingTable;
    }
    async validateColumnExists(dataTableId, columnId) {
        const existingColumn = await this.dataTableColumnRepository.findOneBy({
            id: columnId,
            dataTableId,
        });
        if (existingColumn === null) {
            throw new data_table_column_not_found_error_1.DataTableColumnNotFoundError(dataTableId, columnId);
        }
        return existingColumn;
    }
    async validateUniqueName(name, projectId) {
        const hasNameClash = await this.dataTableRepository.existsBy({
            name,
            projectId,
        });
        if (hasNameClash) {
            throw new data_table_name_conflict_error_1.DataTableNameConflictError(name);
        }
    }
    validateAndTransformFilters(filterObject, columns) {
        const transformedRows = this.validateAndTransformRows(filterObject.filters.map((f) => {
            return {
                [f.columnName]: f.value,
            };
        }), columns, true, true);
        const columnTypeMap = new Map([
            ...Object.entries(n8n_workflow_1.DATA_TABLE_SYSTEM_COLUMN_TYPE_MAP),
            ...columns.map((c) => [c.name, c.type]),
        ]);
        const transformedFilters = filterObject.filters.map((filter, index) => {
            const transformedValue = transformedRows[index][filter.columnName];
            if (columnTypeMap.get(filter.columnName) !== 'string') {
                if (filter.condition === 'isEmpty') {
                    return { ...filter, condition: 'eq', value: null };
                }
                if (filter.condition === 'isNotEmpty') {
                    return { ...filter, condition: 'neq', value: null };
                }
            }
            if (['like', 'ilike'].includes(filter.condition)) {
                if (transformedValue === null || transformedValue === undefined) {
                    throw new data_table_validation_error_1.DataTableValidationError(`${filter.condition.toUpperCase()} filter value cannot be null or undefined`);
                }
                if (typeof transformedValue !== 'string') {
                    throw new data_table_validation_error_1.DataTableValidationError(`${filter.condition.toUpperCase()} filter value must be a string`);
                }
                const valueWithWildcards = transformedValue.includes('%')
                    ? transformedValue
                    : `%${transformedValue}%`;
                return { ...filter, value: valueWithWildcards };
            }
            if (['gt', 'gte', 'lt', 'lte'].includes(filter.condition)) {
                if (transformedValue === null || transformedValue === undefined) {
                    throw new data_table_validation_error_1.DataTableValidationError(`${filter.condition.toUpperCase()} filter value cannot be null or undefined`);
                }
            }
            return { ...filter, value: transformedValue };
        });
        return { ...filterObject, filters: transformedFilters };
    }
    async validateDataTableSize() {
        await this.dataTableSizeValidator.validateSize(async () => await this.dataTableRepository.findDataTablesSize());
    }
    async getDataTablesSize(user) {
        const allSizeData = await this.dataTableSizeValidator.getCachedSizeData(async () => await this.dataTableRepository.findDataTablesSize());
        let dataTables;
        if ((0, permissions_1.hasGlobalScope)(user, 'dataTable:listProject')) {
            dataTables = allSizeData.dataTables;
        }
        else {
            const roles = await this.roleService.rolesWithScope('project', ['dataTable:listProject']);
            const accessibleProjectIds = await this.projectRelationRepository.getAccessibleProjectsByRoles(user.id, roles);
            const accessibleProjectIdsSet = new Set(accessibleProjectIds);
            const accessibleDataTables = Object.fromEntries(Object.entries(allSizeData.dataTables).filter(([, dataTableInfo]) => accessibleProjectIdsSet.has(dataTableInfo.projectId)));
            dataTables = accessibleDataTables;
        }
        return {
            totalBytes: allSizeData.totalBytes,
            quotaStatus: this.dataTableSizeValidator.sizeToState(allSizeData.totalBytes),
            dataTables,
        };
    }
    async getCachedSizeBytesByIds(dataTableIds) {
        if (dataTableIds.length === 0)
            return new Map();
        const sizeData = await this.dataTableSizeValidator.getCachedSizeData(async () => await this.dataTableRepository.findDataTablesSize());
        return new Map(dataTableIds.map((id) => [id, sizeData.dataTables[id]?.sizeBytes ?? 0]));
    }
    async findDataTablesByIdsForUser(dataTableIds, user, scopes) {
        if (dataTableIds.length === 0)
            return [];
        if ((0, permissions_1.hasGlobalScope)(user, scopes, { mode: 'allOf' })) {
            return await this.dataTableRepository.find({
                where: { id: (0, typeorm_1.In)(dataTableIds) },
                relations: { columns: true, project: true },
            });
        }
        const roles = await this.roleService.rolesWithScope('project', scopes);
        const accessibleProjectIds = await this.projectRelationRepository.getAccessibleProjectsByRoles(user.id, roles);
        if (accessibleProjectIds.length === 0)
            return [];
        return await this.dataTableRepository.find({
            where: { id: (0, typeorm_1.In)(dataTableIds), projectId: (0, typeorm_1.In)(accessibleProjectIds) },
            relations: { columns: true, project: true },
        });
    }
    async generateDataTableCsv(dataTableId, projectId, includeSystemColumns = true) {
        const dataTable = await this.validateDataTableExists(dataTableId, projectId);
        const columns = await this.dataTableColumnRepository.getColumns(dataTableId);
        const { data: rows } = await this.dataTableRowsRepository.getManyAndCount(dataTableId, {
            skip: 0,
        }, columns);
        const csvContent = this.buildCsvContent(rows, columns, includeSystemColumns);
        return {
            csvContent,
            dataTableName: dataTable.name,
        };
    }
    buildCsvContent(rows, columns, includeSystemColumns = true) {
        const sortedColumns = [...columns].sort((a, b) => a.index - b.index);
        const userHeaders = sortedColumns.map((col) => col.name);
        const headers = includeSystemColumns
            ? ['id', ...userHeaders, 'createdAt', 'updatedAt']
            : userHeaders;
        const csvRows = [headers.map((h) => this.escapeCsvValue(h)).join(',')];
        for (const row of rows) {
            const values = [];
            if (includeSystemColumns) {
                values.push(this.escapeCsvValue(row.id));
            }
            for (const column of sortedColumns) {
                const value = row[column.name];
                values.push(this.escapeCsvValue(this.formatValueForCsv(value, column.type)));
            }
            if (includeSystemColumns) {
                values.push(this.escapeCsvValue(this.formatDateForCsv(row.createdAt)));
                values.push(this.escapeCsvValue(this.formatDateForCsv(row.updatedAt)));
            }
            csvRows.push(values.join(','));
        }
        return csvRows.join('\n');
    }
    formatValueForCsv(value, columnType) {
        if (value === null || value === undefined) {
            return '';
        }
        if (columnType === 'date') {
            if (value instanceof Date || typeof value === 'string') {
                return this.formatDateForCsv(value);
            }
        }
        if (columnType === 'boolean') {
            if (value === 1 || value === '1') {
                return 'true';
            }
            if (value === 0 || value === '0') {
                return 'false';
            }
            return String(value);
        }
        if (columnType === 'number') {
            return String(value);
        }
        return String(value);
    }
    formatDateForCsv(date) {
        if (date instanceof Date) {
            return date.toISOString();
        }
        const parsed = new Date(date);
        return !isNaN(parsed.getTime()) ? parsed.toISOString() : String(date);
    }
    escapeCsvValue(value) {
        const str = String(value);
        const hasLeadingOrTrailingSpace = str.length > 0 && (str[0] === ' ' || str[str.length - 1] === ' ');
        if (str.includes(',') ||
            str.includes('"') ||
            str.includes('\n') ||
            str.includes('\r') ||
            hasLeadingOrTrailingSpace) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }
};
exports.DataTableService = DataTableService;
exports.DataTableService = DataTableService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [data_table_repository_1.DataTableRepository, data_table_column_repository_1.DataTableColumnRepository, data_table_rows_repository_1.DataTableRowsRepository, backend_common_1.Logger, data_table_size_validator_service_1.DataTableSizeValidator, db_1.ProjectRelationRepository, backend_services_1.RoleService, data_table_csv_import_service_1.DataTableCsvImportService, backend_services_1.EventService, db_1.ProjectRepository, project_service_ee_1.ProjectService])
], DataTableService);
//# sourceMappingURL=data-table.service.js.map