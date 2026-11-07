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
exports.DataTableRepository = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const data_table_column_entity_1 = require("./data-table-column.entity");
const data_table_ddl_service_1 = require("./data-table-ddl.service");
const data_table_entity_1 = require("./data-table.entity");
const data_table_name_conflict_error_1 = require("./errors/data-table-name-conflict.error");
const data_table_system_column_name_conflict_error_1 = require("./errors/data-table-system-column-name-conflict.error");
const data_table_validation_error_1 = require("./errors/data-table-validation.error");
const sql_utils_1 = require("./utils/sql-utils");
let DataTableRepository = class DataTableRepository extends typeorm_1.Repository {
    constructor(dataSource, ddlService, globalConfig, logger) {
        super(data_table_entity_1.DataTable, dataSource.manager);
        this.ddlService = ddlService;
        this.globalConfig = globalConfig;
        this.logger = logger;
        this.parseSize = (bytes) => bytes === null ? 0 : typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    }
    async touchUpdatedAt(dataTableId, trx) {
        await (0, db_1.withTransaction)(this.manager, trx, async (em) => {
            await em.update(data_table_entity_1.DataTable, { id: dataTableId }, { updatedAt: new Date() });
        }).catch((error) => {
            this.logger.warn('Failed to update DataTable timestamp', { dataTableId, error });
        });
    }
    async createDataTable(projectId, name, columns, trx, explicitId, explicitColumnIds) {
        return await (0, db_1.withTransaction)(this.manager, trx, async (em) => {
            if (columns.some((c) => !(0, sql_utils_1.isValidColumnName)(c.name))) {
                throw new data_table_validation_error_1.DataTableValidationError(api_types_1.DATA_TABLE_COLUMN_ERROR_MESSAGE);
            }
            for (const col of columns) {
                const lowerName = col.name.toLowerCase();
                if (n8n_workflow_1.DATA_TABLE_SYSTEM_COLUMNS.some((sc) => sc.toLowerCase() === lowerName)) {
                    throw new data_table_system_column_name_conflict_error_1.DataTableSystemColumnNameConflictError(col.name);
                }
                if (lowerName === n8n_workflow_1.DATA_TABLE_SYSTEM_TESTING_COLUMN.toLowerCase()) {
                    throw new data_table_system_column_name_conflict_error_1.DataTableSystemColumnNameConflictError(col.name, 'testing');
                }
            }
            const dataTable = em.create(data_table_entity_1.DataTable, {
                ...(explicitId === undefined ? {} : { id: explicitId }),
                name,
                columns,
                projectId,
            });
            await em.insert(data_table_entity_1.DataTable, dataTable);
            const dataTableId = dataTable.id;
            const columnEntities = columns.map((col, index) => em.create(data_table_column_entity_1.DataTableColumn, {
                id: explicitColumnIds?.[index],
                dataTableId,
                name: col.name,
                type: col.type,
                index: col.index ?? index,
            }));
            if (columnEntities.length > 0) {
                await em.insert(data_table_column_entity_1.DataTableColumn, columnEntities);
            }
            await this.ddlService.createTableWithColumns(dataTableId, columnEntities, em);
            if (!dataTableId) {
                throw new n8n_workflow_1.UnexpectedError('Data table creation failed');
            }
            const createdDataTable = await em.findOneOrFail(data_table_entity_1.DataTable, {
                where: { id: dataTableId },
                relations: ['project', 'columns'],
            });
            return createdDataTable;
        });
    }
    async deleteDataTable(dataTableId, trx) {
        return await (0, db_1.withTransaction)(this.manager, trx, async (em) => {
            await em.delete(data_table_entity_1.DataTable, { id: dataTableId });
            await this.ddlService.dropTable(dataTableId, em);
            return true;
        });
    }
    async transferDataTableByProjectId(fromProjectId, toProjectId, trx) {
        if (fromProjectId === toProjectId)
            return false;
        return await (0, db_1.withTransaction)(this.manager, trx, async (em) => {
            const existingTables = await em.findBy(data_table_entity_1.DataTable, { projectId: fromProjectId });
            let transferred = false;
            for (const existing of existingTables) {
                let name = existing.name;
                const hasNameClash = await em.existsBy(data_table_entity_1.DataTable, {
                    name,
                    projectId: toProjectId,
                });
                if (hasNameClash) {
                    const project = await em.findOneByOrFail(db_1.Project, { id: fromProjectId });
                    name = `${existing.name} (${project.name})`;
                    const stillHasNameClash = await em.existsBy(data_table_entity_1.DataTable, {
                        name,
                        projectId: toProjectId,
                    });
                    if (stillHasNameClash) {
                        throw new data_table_name_conflict_error_1.DataTableNameConflictError(`Failed to transfer data table "${existing.name}" to the target project "${toProjectId}". A data table with the same name already exists in the target project.`);
                    }
                }
                await em.update(data_table_entity_1.DataTable, { id: existing.id }, { name, projectId: toProjectId });
                transferred = true;
            }
            return transferred;
        });
    }
    async deleteDataTableByProjectId(projectId, trx) {
        return await (0, db_1.withTransaction)(this.manager, trx, async (em) => {
            const existingTables = await em.findBy(data_table_entity_1.DataTable, { projectId });
            let changed = false;
            for (const match of existingTables) {
                const result = await this.deleteDataTable(match.id, em);
                changed = changed || result;
            }
            return changed;
        });
    }
    async deleteDataTableAll(trx) {
        return await (0, db_1.withTransaction)(this.manager, trx, async (em) => {
            const existingTables = await em.findBy(data_table_entity_1.DataTable, {});
            let changed = false;
            for (const match of existingTables) {
                const result = await em.delete(data_table_entity_1.DataTable, { id: match.id });
                await this.ddlService.dropTable(match.id, em);
                changed = changed || (result.affected ?? 0) > 0;
            }
            return changed;
        });
    }
    async findSummariesByIds(ids) {
        if (ids.length === 0)
            return [];
        return await this.find({
            select: ['id', 'name', 'projectId'],
            where: { id: (0, typeorm_1.In)(ids) },
        });
    }
    async getManyAndCount(options) {
        const query = this.getManyQuery(options);
        const [data, count] = await query.getManyAndCount();
        return { count, data };
    }
    async getMany(options) {
        const query = this.getManyQuery(options);
        return await query.getMany();
    }
    getManyQuery(options) {
        const query = this.createQueryBuilder('dataTable');
        this.applySelections(query);
        this.applyFilters(query, options.filter);
        this.applySorting(query, options.sortBy);
        this.applyPagination(query, options);
        return query;
    }
    applySelections(query) {
        this.applyDefaultSelect(query);
    }
    applyFilters(query, filter) {
        for (const x of ['id', 'projectId']) {
            const content = [filter?.[x]].flat().filter((x) => x !== undefined);
            if (content.length === 0)
                continue;
            query.andWhere(`dataTable.${x} IN (:...${x}s)`, {
                [x + 's']: content.length > 0 ? content : [''],
            });
        }
        if (filter?.name) {
            const nameFilters = Array.isArray(filter.name) ? filter.name : [filter.name];
            nameFilters.forEach((name, i) => {
                query.andWhere(`LOWER(dataTable.name) LIKE LOWER(:name${i})`, {
                    ['name' + i]: `%${name}%`,
                });
            });
        }
    }
    applySorting(query, sortBy) {
        if (!sortBy) {
            query.orderBy('dataTable.updatedAt', 'DESC');
            return;
        }
        const { column, direction } = (0, db_1.parseListQuerySortBy)(sortBy);
        this.applySortingByField(query, column, direction);
    }
    applySortingByField(query, field, direction) {
        if (field === 'name') {
            query
                .addSelect('LOWER(dataTable.name)', 'datatable_name_lower')
                .orderBy('datatable_name_lower', direction);
        }
        else if (['createdAt', 'updatedAt'].includes(field)) {
            query.orderBy(`dataTable.${field}`, direction);
        }
        else if (field === 'size') {
            query
                .leftJoin(`(${this.getDataTableSizeQuery()})`, 'size_data', `size_data.table_name = '${(0, sql_utils_1.toTableName)('')}' || dataTable.id`)
                .addSelect('size_data.table_bytes', 'size')
                .orderBy('size', direction);
        }
    }
    applyPagination(query, options) {
        query.skip(options.skip ?? 0);
        if (options.take !== undefined)
            query.take(options.take);
    }
    applyDefaultSelect(query) {
        query
            .leftJoinAndSelect('dataTable.project', 'project')
            .leftJoinAndSelect('dataTable.columns', 'data_table_column')
            .select([
            'dataTable',
            ...this.getDataTableColumnFields('data_table_column'),
            ...this.getProjectFields('project'),
        ]);
    }
    getDataTableColumnFields(alias) {
        return [
            `${alias}.id`,
            `${alias}.name`,
            `${alias}.type`,
            `${alias}.createdAt`,
            `${alias}.updatedAt`,
            `${alias}.index`,
        ];
    }
    getProjectFields(alias) {
        return [`${alias}.id`, `${alias}.name`, `${alias}.type`, `${alias}.icon`];
    }
    async findDataTablesSize() {
        const sizeMap = await this.getAllDataTablesSizeMap();
        const totalBytes = Array.from(sizeMap.values()).reduce((sum, size) => sum + size, 0);
        const query = this.createQueryBuilder('dt')
            .leftJoinAndSelect('dt.project', 'p')
            .select(['dt.id', 'dt.name', 'p.id', 'p.name']);
        const dataTablesWithProjects = await query.getMany();
        const dataTables = {};
        for (const dt of dataTablesWithProjects) {
            const sizeBytes = sizeMap.get(dt.id) ?? 0;
            dataTables[dt.id] = {
                id: dt.id,
                name: dt.name,
                projectId: dt.project.id,
                projectName: dt.project.name,
                sizeBytes,
            };
        }
        return {
            totalBytes,
            dataTables,
        };
    }
    getDataTableSizeQuery() {
        const dbType = this.globalConfig.database.type;
        const tablePattern = (0, sql_utils_1.toTableName)('%');
        let sql = '';
        switch (dbType) {
            case 'sqlite':
                sql = `
        WITH data_table_names(name) AS (
          SELECT name
          FROM sqlite_schema
          WHERE type = 'table' AND name GLOB '${(0, sql_utils_1.toTableName)('*')}'
        )
        SELECT t.name AS table_name, (SELECT SUM(pgsize) FROM dbstat WHERE name = t.name) AS table_bytes
        FROM data_table_names AS t
      `;
                break;
            case 'postgresdb': {
                const schemaName = this.globalConfig.database.postgresdb?.schema;
                sql = `
        SELECT c.relname AS table_name, pg_total_relation_size(c.oid) AS table_bytes
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = '${schemaName}'
           AND c.relname LIKE '${tablePattern}'
           AND c.relkind IN ('r', 'm', 'p')
      `;
                break;
            }
        }
        return sql;
    }
    async getAllDataTablesSizeMap() {
        const sql = this.getDataTableSizeQuery();
        const sizeMap = new Map();
        if (sql === '')
            return sizeMap;
        const result = (await this.query(sql));
        for (const row of result) {
            if (row.table_bytes !== null && row.table_name) {
                const dataTableId = (0, sql_utils_1.toTableId)(row.table_name);
                const sizeBytes = this.parseSize(row.table_bytes);
                sizeMap.set(dataTableId, (sizeMap.get(dataTableId) ?? 0) + sizeBytes);
            }
        }
        return sizeMap;
    }
};
exports.DataTableRepository = DataTableRepository;
exports.DataTableRepository = DataTableRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, data_table_ddl_service_1.DataTableDDLService, config_1.GlobalConfig, backend_common_1.Logger])
], DataTableRepository);
//# sourceMappingURL=data-table.repository.js.map