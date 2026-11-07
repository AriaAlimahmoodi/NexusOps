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
exports.DataTableRowsRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const sql_utils_1 = require("./utils/sql-utils");
function getConditionAndParams(filter, index, dbType, tableReference) {
    const paramName = `filter_${index}`;
    const columnRef = tableReference
        ? `${(0, sql_utils_1.quoteIdentifier)(tableReference, dbType)}.${(0, sql_utils_1.quoteIdentifier)(filter.columnName, dbType)}`
        : (0, sql_utils_1.quoteIdentifier)(filter.columnName, dbType);
    switch (filter.condition) {
        case 'isEmpty':
            return [`(${columnRef} IS NULL OR ${columnRef} = '')`, {}];
        case 'isNotEmpty':
            return [`(${columnRef} IS NOT NULL AND ${columnRef} != '')`, {}];
    }
    if (filter.value === null) {
        switch (filter.condition) {
            case 'eq':
                return [`${columnRef} IS NULL`, {}];
            case 'neq':
                return [`${columnRef} IS NOT NULL`, {}];
        }
    }
    const value = filter.value;
    const operators = {
        eq: '=',
        gt: '>',
        gte: '>=',
        lt: '<',
        lte: '<=',
    };
    if (operators[filter.condition]) {
        return [`${columnRef} ${operators[filter.condition]} :${paramName}`, { [paramName]: value }];
    }
    if (filter.condition === 'neq') {
        return [`(${columnRef} != :${paramName} OR ${columnRef} IS NULL)`, { [paramName]: value }];
    }
    switch (filter.condition) {
        case 'like':
            if (['sqlite', 'sqlite-pooled'].includes(dbType)) {
                const globValue = (0, sql_utils_1.toSqliteGlobFromPercent)(value);
                return [`${columnRef} GLOB :${paramName}`, { [paramName]: globValue }];
            }
            if (dbType === 'postgres') {
                const escapedValue = (0, sql_utils_1.escapeLikeSpecials)(value);
                return [`${columnRef} LIKE :${paramName} ESCAPE '\\'`, { [paramName]: escapedValue }];
            }
            return [`${columnRef} LIKE :${paramName}`, { [paramName]: value }];
        case 'ilike':
            if (['sqlite', 'sqlite-pooled'].includes(dbType)) {
                const escapedValue = (0, sql_utils_1.escapeLikeSpecials)(value);
                return [
                    `UPPER(${columnRef}) LIKE UPPER(:${paramName}) ESCAPE '\\'`,
                    { [paramName]: escapedValue },
                ];
            }
            if (dbType === 'postgres') {
                const escapedValue = (0, sql_utils_1.escapeLikeSpecials)(value);
                return [`${columnRef} ILIKE :${paramName} ESCAPE '\\'`, { [paramName]: escapedValue }];
            }
            return [`UPPER(${columnRef}) LIKE UPPER(:${paramName})`, { [paramName]: value }];
    }
    throw new Error(`Unsupported filter condition: ${filter.condition}`);
}
let DataTableRowsRepository = class DataTableRowsRepository {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async insertRowsBulk(table, rows, columns, trx) {
        return await (0, db_1.withTransaction)(this.dataSource.manager, trx, async (em) => {
            let insertedRows = 0;
            if (columns.length === 0) {
                for (const row of rows) {
                    const query = em.createQueryBuilder().insert().into(table).values(row);
                    await query.execute();
                    insertedRows++;
                }
                return { success: true, insertedRows };
            }
            const batchSize = 800;
            const batches = Math.max(1, Math.ceil((columns.length * rows.length) / batchSize));
            const rowsPerBatch = Math.ceil(rows.length / batches);
            const columnNames = columns.map((x) => x.name);
            const dbType = this.dataSource.options.type;
            for (let i = 0; i < batches; ++i) {
                const start = i * rowsPerBatch;
                const endExclusive = Math.min(rows.length, (i + 1) * rowsPerBatch);
                if (endExclusive <= start)
                    break;
                const completeRows = new Array(endExclusive - start);
                for (let j = start; j < endExclusive; ++j) {
                    const insertArray = [];
                    for (let h = 0; h < columnNames.length; ++h) {
                        const column = columns[h];
                        const value = rows[j][column.name] ?? null;
                        insertArray[h] = (0, sql_utils_1.normalizeValueForDatabase)(value, column.type, dbType);
                    }
                    completeRows[j - start] = insertArray;
                }
                const query = em
                    .createQueryBuilder()
                    .insert()
                    .into(table, columnNames)
                    .values(completeRows);
                await query.execute();
                insertedRows += completeRows.length;
            }
            return { success: true, insertedRows };
        });
    }
    async insertRows(dataTableId, rows, columns, returnType, trx) {
        return await (0, db_1.withTransaction)(this.dataSource.manager, trx, async (em) => {
            const inserted = [];
            const dbType = this.dataSource.options.type;
            const useReturning = dbType === 'postgres';
            const table = (0, sql_utils_1.toTableName)(dataTableId);
            const escapedColumns = columns.map((c) => this.dataSource.driver.escape(c.name));
            const escapedSystemColumns = n8n_workflow_1.DATA_TABLE_SYSTEM_COLUMNS.map((x) => this.dataSource.driver.escape(x));
            const selectColumns = [...escapedSystemColumns, ...escapedColumns];
            if (returnType === 'count') {
                return await this.insertRowsBulk(table, rows, columns, em);
            }
            for (const row of rows) {
                const completeRow = { ...row };
                for (const column of columns) {
                    if (!(column.name in completeRow)) {
                        completeRow[column.name] = null;
                    }
                    completeRow[column.name] = (0, sql_utils_1.normalizeValueForDatabase)(completeRow[column.name], column.type, dbType);
                }
                const query = em.createQueryBuilder().insert().into(table).values(completeRow);
                if (useReturning) {
                    query.returning(returnType === 'all' ? selectColumns.join(',') : 'id');
                }
                const result = await query.execute();
                if (useReturning) {
                    const returned = returnType === 'all'
                        ? (0, sql_utils_1.normalizeRows)((0, sql_utils_1.extractReturningData)(result.raw), columns)
                        : (0, sql_utils_1.extractInsertedIds)(result.raw, dbType).map((id) => ({ id }));
                    inserted.push.apply(inserted, returned);
                    continue;
                }
                const ids = (0, sql_utils_1.extractInsertedIds)(result.raw, dbType);
                if (ids.length === 0) {
                    throw new n8n_workflow_1.UnexpectedError("Couldn't find the inserted row ID");
                }
                if (returnType === 'id') {
                    inserted.push(...ids.map((id) => ({ id })));
                    continue;
                }
                const insertedRows = await this.getManyByIds(dataTableId, ids, columns, em);
                inserted.push(...insertedRows);
            }
            return inserted;
        });
    }
    async updateRows(dataTableId, data, filter, columns, returnData = false, trx) {
        return await (0, db_1.withTransaction)(this.dataSource.manager, trx, async (em) => {
            const dbType = this.dataSource.options.type;
            const useReturning = dbType === 'postgres';
            const table = (0, sql_utils_1.toTableName)(dataTableId);
            const escapedColumns = columns.map((c) => this.dataSource.driver.escape(c.name));
            const escapedSystemColumns = n8n_workflow_1.DATA_TABLE_SYSTEM_COLUMNS.map((x) => this.dataSource.driver.escape(x));
            const selectColumns = [...escapedSystemColumns, ...escapedColumns];
            const setData = this.prepareUpdateData(data, columns, dbType);
            let affectedRows = [];
            if (!useReturning && returnData) {
                affectedRows = await this.getAffectedRowsForUpdate(dataTableId, filter, columns, true, em);
            }
            setData.updatedAt = (0, sql_utils_1.normalizeValueForDatabase)(new Date(), 'date', dbType);
            const query = em.createQueryBuilder().update(table);
            this.applyFilters(query, filter, undefined);
            query.set(setData);
            if (useReturning && returnData) {
                query.returning(selectColumns.join(','));
            }
            const result = await query.execute();
            if (!returnData) {
                return true;
            }
            if (useReturning) {
                return (0, sql_utils_1.normalizeRows)((0, sql_utils_1.extractReturningData)(result.raw), columns);
            }
            const ids = affectedRows.map((row) => row.id);
            return await this.getManyByIds(dataTableId, ids, columns, em);
        });
    }
    async dryRunUpdateRows(dataTableId, data, filter, columns, trx) {
        const dbType = this.dataSource.options.type;
        const beforeRows = await this.getAffectedRowsForUpdate(dataTableId, filter, columns, false, trx);
        const columnUpdates = this.prepareUpdateData(data, columns, dbType);
        return beforeRows.flatMap((original) => {
            const updated = { ...original, ...columnUpdates, updatedAt: new Date() };
            return this.toDryRunRows(original, updated);
        });
    }
    async dryRunUpsertRow(dataTableId, data, filter, columns, trx) {
        const updateResult = await this.dryRunUpdateRows(dataTableId, data, filter, columns, trx);
        if (updateResult.length > 0) {
            return updateResult;
        }
        const dbType = this.dataSource.options.type;
        const now = new Date();
        const preparedData = this.prepareUpdateData(data, columns, dbType);
        const insertedRow = {
            id: 0,
            createdAt: now,
            updatedAt: now,
            ...preparedData,
        };
        return this.toDryRunRows(null, insertedRow);
    }
    async deleteRows(dataTableId, columns, filter, returnData = false, dryRun = false, trx) {
        return await (0, db_1.withTransaction)(this.dataSource.manager, trx, async (em) => {
            const dbType = this.dataSource.options.type;
            const useReturning = !dryRun && dbType === 'postgres';
            const shouldReturnData = returnData || dryRun;
            const table = (0, sql_utils_1.toTableName)(dataTableId);
            if (!shouldReturnData) {
                const query = em.createQueryBuilder().delete().from(table, 'dataTable');
                if (filter) {
                    this.applyFilters(query, filter, undefined);
                }
                await query.execute();
                return true;
            }
            let affectedRows = [];
            if (!useReturning) {
                const selectQuery = em.createQueryBuilder().select('*').from(table, 'dataTable');
                if (filter) {
                    this.applyFilters(selectQuery, filter, 'dataTable');
                }
                const rawRows = await selectQuery.getRawMany();
                affectedRows = (0, sql_utils_1.normalizeRows)(rawRows, columns);
            }
            if (dryRun) {
                return affectedRows.flatMap((row) => this.toDryRunRows(row, null));
            }
            const deleteQuery = em.createQueryBuilder().delete().from(table, 'dataTable');
            if (useReturning) {
                const escapedColumns = columns.map((c) => this.dataSource.driver.escape(c.name));
                const escapedSystemColumns = n8n_workflow_1.DATA_TABLE_SYSTEM_COLUMNS.map((x) => this.dataSource.driver.escape(x));
                const selectColumns = [...escapedSystemColumns, ...escapedColumns];
                deleteQuery.returning(selectColumns.join(','));
            }
            if (filter) {
                this.applyFilters(deleteQuery, filter, undefined);
            }
            const result = await deleteQuery.execute();
            if (useReturning) {
                affectedRows = (0, sql_utils_1.normalizeRows)((0, sql_utils_1.extractReturningData)(result.raw), columns);
            }
            return affectedRows;
        });
    }
    async clearRows(dataTableId, trx) {
        return await (0, db_1.withTransaction)(this.dataSource.manager, trx, async (em) => {
            const table = (0, sql_utils_1.toTableName)(dataTableId);
            const result = await em.createQueryBuilder().delete().from(table).execute();
            return { deletedCount: result.affected ?? 0 };
        });
    }
    async getAffectedRowsForUpdate(dataTableId, filter, columns, idsOnly, trx) {
        return await (0, db_1.withTransaction)(this.dataSource.manager, trx, async (em) => {
            const table = (0, sql_utils_1.toTableName)(dataTableId);
            const selectColumns = idsOnly ? 'id' : '*';
            const selectQuery = em.createQueryBuilder().select(selectColumns).from(table, 'dataTable');
            this.applyFilters(selectQuery, filter, 'dataTable');
            const rawRows = await selectQuery.getRawMany();
            if (idsOnly) {
                return rawRows;
            }
            return (0, sql_utils_1.normalizeRows)(rawRows, columns);
        });
    }
    prepareUpdateData(data, columns, dbType) {
        const setData = { ...data };
        for (const column of columns) {
            if (column.name in setData) {
                setData[column.name] = (0, sql_utils_1.normalizeValueForDatabase)(setData[column.name], column.type, dbType);
            }
        }
        return setData;
    }
    toDryRunRows(beforeState, afterState) {
        if (beforeState === null && afterState === null) {
            throw new Error('Both before and after rows cannot be null');
        }
        if (beforeState && afterState) {
            return [
                { ...beforeState, dryRunState: 'before' },
                { ...afterState, dryRunState: 'after' },
            ];
        }
        const template = (beforeState ?? afterState);
        const nullRow = {
            id: null,
            createdAt: null,
            updatedAt: null,
            ...Object.fromEntries(Object.keys(template).map((key) => [key, null])),
        };
        const before = beforeState ?? nullRow;
        const after = afterState ?? nullRow;
        return [
            { ...before, dryRunState: 'before' },
            { ...after, dryRunState: 'after' },
        ];
    }
    async getManyAndCount(dataTableId, dto, columns, trx) {
        const em = trx ?? this.dataSource.manager;
        const [countQuery, query] = this.getManyQuery(dataTableId, dto, columns, em);
        const data = await query.select('*').getRawMany();
        const countResult = await countQuery.select('COUNT(*) as count').getRawOne();
        const count = typeof countResult?.count === 'number' ? countResult.count : Number(countResult?.count) || 0;
        return { count: count ?? -1, data };
    }
    async getManyByIds(dataTableId, ids, columns, trx) {
        const em = trx ?? this.dataSource.manager;
        const table = (0, sql_utils_1.toTableName)(dataTableId);
        const escapedColumns = columns.map((c) => this.dataSource.driver.escape(c.name));
        const escapedSystemColumns = n8n_workflow_1.DATA_TABLE_SYSTEM_COLUMNS.map((x) => this.dataSource.driver.escape(x));
        const selectColumns = [...escapedSystemColumns, ...escapedColumns];
        if (ids.length === 0) {
            return [];
        }
        const rows = await em
            .createQueryBuilder()
            .select(selectColumns)
            .from(table, 'dataTable')
            .where({ id: (0, typeorm_1.In)(ids) })
            .getRawMany();
        return (0, sql_utils_1.normalizeRows)(rows, columns);
    }
    getManyQuery(dataTableId, dto, columns, em) {
        const query = em.createQueryBuilder();
        const tableReference = 'dataTable';
        query.from((0, sql_utils_1.toTableName)(dataTableId), tableReference);
        if (dto.filter) {
            this.applyFilters(query, dto.filter, tableReference);
        }
        if (dto.search && dto.search.trim().length > 0) {
            this.applySearch(query, dto.search, tableReference, columns);
        }
        const countQuery = query.clone().select('COUNT(*)');
        this.applySorting(query, dto);
        this.applyPagination(query, dto);
        return [countQuery, query];
    }
    applySearch(query, rawSearch, tableReference, columns) {
        const dbType = this.dataSource.options.type;
        const searchTerm = rawSearch.includes('%') ? rawSearch : `%${rawSearch}%`;
        const isSqlite = ['sqlite', 'sqlite-pooled'].includes(dbType);
        const isPg = dbType === 'postgres';
        const allColumnNames = columns.map((c) => c.name);
        if (allColumnNames.length === 0)
            return;
        const tableRefQuoted = (0, sql_utils_1.quoteIdentifier)(tableReference, dbType);
        const conditions = [];
        for (const col of allColumnNames) {
            const colRef = `${tableRefQuoted}.${(0, sql_utils_1.quoteIdentifier)(col, dbType)}`;
            if (isSqlite) {
                conditions.push(`UPPER(CAST(${colRef} AS TEXT)) LIKE UPPER(:search) ESCAPE '\\'`);
                continue;
            }
            if (isPg) {
                conditions.push(`CAST(${colRef} AS TEXT) ILIKE :search ESCAPE '\\'`);
                continue;
            }
            conditions.push(`UPPER(CAST(${colRef} AS TEXT)) LIKE UPPER(:search)`);
        }
        if (conditions.length === 0)
            return;
        const whereClause = `(${conditions.join(' OR ')})`;
        query.andWhere(whereClause, { search: (0, sql_utils_1.escapeLikeSpecials)(searchTerm) });
    }
    applyFilters(query, filter, tableReference) {
        const filters = filter.filters ?? [];
        const filterType = filter.type ?? 'and';
        const dbType = this.dataSource.options.type;
        const conditionsAndParams = filters.map((filter, i) => getConditionAndParams(filter, i, dbType, tableReference));
        if (conditionsAndParams.length === 1) {
            const [condition, params] = conditionsAndParams[0];
            query.andWhere(condition, params);
        }
        else {
            for (const [condition, params] of conditionsAndParams) {
                if (filterType === 'or') {
                    query.orWhere(condition, params);
                }
                else {
                    query.andWhere(condition, params);
                }
            }
        }
    }
    applySorting(query, dto) {
        if (dto.sortBy) {
            const [field, order] = dto.sortBy;
            this.applySortingByField(query, field, order);
        }
        if (!dto.sortBy || dto.sortBy[0] !== 'id') {
            const dbType = this.dataSource.options.type;
            const quotedId = `${(0, sql_utils_1.quoteIdentifier)('dataTable', dbType)}.${(0, sql_utils_1.quoteIdentifier)('id', dbType)}`;
            query.addOrderBy(quotedId, 'ASC');
        }
    }
    applySortingByField(query, field, direction) {
        const dbType = this.dataSource.options.type;
        if (!(0, sql_utils_1.isValidColumnName)(field))
            throw new n8n_workflow_1.UserError('Incorrect column format');
        const quotedField = `${(0, sql_utils_1.quoteIdentifier)('dataTable', dbType)}.${(0, sql_utils_1.quoteIdentifier)(field, dbType)}`;
        query.orderBy(quotedField, direction);
    }
    applyPagination(query, dto) {
        query.skip(dto.skip ?? 0);
        if (dto.take)
            query.take(dto.take);
    }
};
exports.DataTableRowsRepository = DataTableRowsRepository;
exports.DataTableRowsRepository = DataTableRowsRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], DataTableRowsRepository);
//# sourceMappingURL=data-table-rows.repository.js.map