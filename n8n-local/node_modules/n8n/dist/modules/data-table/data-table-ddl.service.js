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
exports.DataTableDDLService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const sql_utils_1 = require("./utils/sql-utils");
let DataTableDDLService = class DataTableDDLService {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async createTableWithColumns(dataTableId, columns, trx) {
        await (0, db_1.withTransaction)(this.dataSource.manager, trx, async (em) => {
            if (!em.queryRunner) {
                throw new n8n_workflow_1.UnexpectedError('QueryRunner is not available');
            }
            const dslColumns = [new db_1.DslColumn('id').int.autoGenerate2.primary, ...(0, sql_utils_1.toDslColumns)(columns)];
            const createTable = new db_1.CreateTable((0, sql_utils_1.toTableName)(dataTableId), '', em.queryRunner).withColumns(...dslColumns).withTimestamps;
            await createTable.execute(em.queryRunner);
        });
    }
    async dropTable(dataTableId, trx) {
        await (0, db_1.withTransaction)(this.dataSource.manager, trx, async (em) => {
            if (!em.queryRunner) {
                throw new n8n_workflow_1.UnexpectedError('QueryRunner is not available');
            }
            await em.queryRunner.dropTable((0, sql_utils_1.toTableName)(dataTableId), true);
        });
    }
    async renameTable(oldDataTableId, newDataTableId, dbType, trx) {
        if (!(0, sql_utils_1.isValidDataTableId)(oldDataTableId) || !(0, sql_utils_1.isValidDataTableId)(newDataTableId)) {
            throw new n8n_workflow_1.UnexpectedError('Invalid data table ID');
        }
        await (0, db_1.withTransaction)(this.dataSource.manager, trx, async (em) => {
            await em.query((0, sql_utils_1.renameTableQuery)((0, sql_utils_1.toTableName)(oldDataTableId), (0, sql_utils_1.toTableName)(newDataTableId), dbType));
        });
    }
    async tableExists(dataTableId, trx) {
        return await (0, db_1.withTransaction)(this.dataSource.manager, trx, async (em) => {
            if (!em.queryRunner) {
                throw new n8n_workflow_1.UnexpectedError('QueryRunner is not available');
            }
            return await em.queryRunner.hasTable((0, sql_utils_1.toTableName)(dataTableId));
        });
    }
    async addColumn(dataTableId, column, dbType, trx) {
        await (0, db_1.withTransaction)(this.dataSource.manager, trx, async (em) => {
            await em.query((0, sql_utils_1.addColumnQuery)((0, sql_utils_1.toTableName)(dataTableId), column, dbType));
        });
    }
    async dropColumnFromTable(dataTableId, columnName, dbType, trx) {
        await (0, db_1.withTransaction)(this.dataSource.manager, trx, async (em) => {
            await em.query((0, sql_utils_1.deleteColumnQuery)((0, sql_utils_1.toTableName)(dataTableId), columnName, dbType));
        });
    }
    async renameColumn(dataTableId, oldColumnName, newColumnName, dbType, trx) {
        await (0, db_1.withTransaction)(this.dataSource.manager, trx, async (em) => {
            await em.query((0, sql_utils_1.renameColumnQuery)((0, sql_utils_1.toTableName)(dataTableId), oldColumnName, newColumnName, dbType));
        });
    }
};
exports.DataTableDDLService = DataTableDDLService;
exports.DataTableDDLService = DataTableDDLService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], DataTableDDLService);
//# sourceMappingURL=data-table-ddl.service.js.map