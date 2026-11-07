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
exports.DataTableColumnRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const data_table_column_entity_1 = require("./data-table-column.entity");
const data_table_ddl_service_1 = require("./data-table-ddl.service");
const data_table_entity_1 = require("./data-table.entity");
const data_table_column_name_conflict_error_1 = require("./errors/data-table-column-name-conflict.error");
const data_table_column_not_found_error_1 = require("./errors/data-table-column-not-found.error");
const data_table_not_found_error_1 = require("./errors/data-table-not-found.error");
const data_table_system_column_name_conflict_error_1 = require("./errors/data-table-system-column-name-conflict.error");
const data_table_validation_error_1 = require("./errors/data-table-validation.error");
const pair_columns_1 = require("./utils/pair-columns");
let DataTableColumnRepository = class DataTableColumnRepository extends db_1.BaseRepository {
    constructor(dataSource, ddlService, transactionRunner) {
        super(data_table_column_entity_1.DataTableColumn, dataSource.manager, transactionRunner);
        this.ddlService = ddlService;
    }
    validateNotSystemColumn(columnName) {
        const lowerName = columnName.toLowerCase();
        if (n8n_workflow_1.DATA_TABLE_SYSTEM_COLUMNS.some((sc) => sc.toLowerCase() === lowerName)) {
            throw new data_table_system_column_name_conflict_error_1.DataTableSystemColumnNameConflictError(columnName);
        }
        if (lowerName === n8n_workflow_1.DATA_TABLE_SYSTEM_TESTING_COLUMN.toLowerCase()) {
            throw new data_table_system_column_name_conflict_error_1.DataTableSystemColumnNameConflictError(columnName, 'testing');
        }
    }
    async validateUniqueColumnName(columnName, dataTableId, em) {
        const existingColumnMatch = await em.existsBy(data_table_column_entity_1.DataTableColumn, {
            name: columnName,
            dataTableId,
        });
        if (existingColumnMatch) {
            const dataTable = await em.findOneBy(data_table_entity_1.DataTable, { id: dataTableId });
            if (!dataTable) {
                throw new n8n_workflow_1.UnexpectedError('Data table not found');
            }
            throw new data_table_column_name_conflict_error_1.DataTableColumnNameConflictError(columnName, dataTable.name);
        }
    }
    async getColumns(dataTableId, trx) {
        const em = trx ?? this.manager;
        const columns = await em
            .createQueryBuilder(data_table_column_entity_1.DataTableColumn, 'dsc')
            .where('dsc.dataTableId = :dataTableId', { dataTableId })
            .getMany();
        columns.sort((a, b) => a.index - b.index);
        return columns;
    }
    async findTableIdsByColumnIds(columnIds) {
        return await this.find({ select: ['id', 'dataTableId'], where: { id: (0, typeorm_1.In)(columnIds) } });
    }
    async getColumnByIdOrFail(dataTableId, columnId) {
        const column = await this.findOneBy({ id: columnId, dataTableId });
        if (!column) {
            throw new data_table_column_not_found_error_1.DataTableColumnNotFoundError(dataTableId, columnId);
        }
        return column;
    }
    normalizeAddColumnIndex(index, currentColumnCount) {
        if (index === undefined || index > currentColumnCount) {
            return currentColumnCount;
        }
        if (index < 0) {
            throw new data_table_validation_error_1.DataTableValidationError('tried to add column at a negative index');
        }
        return index;
    }
    async addColumn(dataTableId, schema, trx, explicitId) {
        return await (0, db_1.withTransaction)(this.manager, trx, async (em) => {
            this.validateNotSystemColumn(schema.name);
            await this.validateUniqueColumnName(schema.name, dataTableId, em);
            const columns = await this.getColumns(dataTableId, em);
            const columnCount = columns.length;
            schema.index = this.normalizeAddColumnIndex(schema.index, columnCount);
            if (schema.index < columnCount) {
                await this.shiftColumns(dataTableId, schema.index, 1, em);
            }
            const column = em.create(data_table_column_entity_1.DataTableColumn, {
                id: explicitId,
                name: schema.name,
                type: schema.type,
                index: schema.index,
                dataTableId,
            });
            await em.insert(data_table_column_entity_1.DataTableColumn, column);
            await this.ddlService.addColumn(dataTableId, column, em.connection.options.type, em);
            return column;
        });
    }
    async deleteColumn(dataTableId, column, trx) {
        await (0, db_1.withTransaction)(this.manager, trx, async (em) => {
            await em.remove(data_table_column_entity_1.DataTableColumn, column);
            await this.ddlService.dropColumnFromTable(dataTableId, column.name, em.connection.options.type, em);
            await this.shiftColumns(dataTableId, column.index, -1, em);
        });
    }
    async replaceSchema(dataTableId, projectId, schema, ctx = {}) {
        await this.runInTransaction(ctx, async (em) => {
            if (!(await em.existsBy(data_table_entity_1.DataTable, { id: dataTableId, projectId }))) {
                throw new data_table_not_found_error_1.DataTableNotFoundError(dataTableId);
            }
            const targetColumns = await this.getColumns(dataTableId, em);
            const { pairs } = (0, pair_columns_1.pairDataTableColumns)(schema.columns, targetColumns);
            const keptPairs = pairs.filter(({ source, target }) => source.type === target.type);
            const renames = (0, pair_columns_1.orderColumnRenames)(pairs);
            if (renames.blocked.length > 0) {
                throw new n8n_workflow_1.UnexpectedError('Column name swaps and cycles must be rejected before this point');
            }
            const keptTargets = new Set(keptPairs.map(({ target }) => target));
            for (const column of targetColumns) {
                if (!keptTargets.has(column))
                    await this.deleteColumn(dataTableId, column, em);
            }
            for (const { source, target } of renames.ordered) {
                await this.renameColumn(dataTableId, target, source.name, em);
            }
            const keptSources = new Set(keptPairs.map(({ source }) => source));
            for (const column of schema.columns) {
                if (keptSources.has(column))
                    continue;
                await this.addColumn(dataTableId, { name: column.name, type: column.type }, em, column.id);
            }
            for (const { source, target } of keptPairs) {
                if (source.id !== undefined && source.id !== target.id) {
                    await em.update(data_table_column_entity_1.DataTableColumn, { id: target.id, dataTableId }, { id: source.id });
                }
            }
            for (const [index, { name }] of schema.columns.entries()) {
                await em.update(data_table_column_entity_1.DataTableColumn, { dataTableId, name }, { index });
            }
            await em.update(data_table_entity_1.DataTable, { id: dataTableId, projectId }, { name: schema.name, updatedAt: new Date() });
        });
    }
    async moveColumn(dataTableId, column, targetIndex, trx) {
        await (0, db_1.withTransaction)(this.manager, trx, async (em) => {
            const columnCount = await em.countBy(data_table_column_entity_1.DataTableColumn, { dataTableId });
            if (targetIndex < 0) {
                throw new data_table_validation_error_1.DataTableValidationError('tried to move column to negative index');
            }
            if (targetIndex >= columnCount) {
                throw new data_table_validation_error_1.DataTableValidationError('tried to move column to an index larger than column count');
            }
            await this.shiftColumns(dataTableId, column.index, -1, em);
            await this.shiftColumns(dataTableId, targetIndex, 1, em);
            await em.update(data_table_column_entity_1.DataTableColumn, { id: column.id }, { index: targetIndex });
        });
    }
    async renameColumn(dataTableId, column, newName, trx) {
        return await (0, db_1.withTransaction)(this.manager, trx, async (em) => {
            this.validateNotSystemColumn(newName);
            await this.validateUniqueColumnName(newName, dataTableId, em);
            const oldName = column.name;
            await em.update(data_table_column_entity_1.DataTableColumn, { id: column.id }, { name: newName });
            await this.ddlService.renameColumn(dataTableId, oldName, newName, em.connection.options.type, em);
            return { ...column, name: newName };
        });
    }
    async shiftColumns(dataTableId, lowestIndex, delta, trx) {
        await (0, db_1.withTransaction)(this.manager, trx, async (em) => {
            await em
                .createQueryBuilder()
                .update(data_table_column_entity_1.DataTableColumn)
                .set({
                index: () => `index + ${delta}`,
            })
                .where('dataTableId = :dataTableId AND index >= :thresholdValue', {
                dataTableId,
                thresholdValue: lowestIndex,
            })
                .execute();
        });
    }
};
exports.DataTableColumnRepository = DataTableColumnRepository;
exports.DataTableColumnRepository = DataTableColumnRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, data_table_ddl_service_1.DataTableDDLService, db_1.TransactionRunner])
], DataTableColumnRepository);
//# sourceMappingURL=data-table-column.repository.js.map