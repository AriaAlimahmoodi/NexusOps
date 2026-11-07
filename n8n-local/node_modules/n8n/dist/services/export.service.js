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
exports.ExportService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const promises_1 = require("fs/promises");
const n8n_core_1 = require("n8n-core");
const sql_utils_1 = require("../modules/data-table/utils/sql-utils");
const compression_util_1 = require("../utils/compression.util");
const validate_database_type_1 = require("../utils/validate-database-type");
const data_table_export_constants_1 = require("./data-table-export.constants");
let ExportService = class ExportService {
    constructor(logger, dataSource, cipher) {
        this.logger = logger;
        this.dataSource = dataSource;
        this.cipher = cipher;
    }
    async clearExistingEntityFiles(outputDir, entityName) {
        const existingFiles = await (0, promises_1.readdir)(outputDir);
        const entityFiles = existingFiles.filter((file) => file.startsWith(`${entityName}.`) && file.endsWith('.jsonl'));
        if (entityFiles.length > 0) {
            this.logger.info(`   🗑️  Found ${entityFiles.length} existing file(s) for ${entityName}, deleting...`);
            for (const file of entityFiles) {
                await (0, promises_1.rm)((0, backend_common_1.safeJoinPath)(outputDir, file));
                this.logger.info(`      Deleted: ${file}`);
            }
        }
    }
    async exportMigrationsTable(outputDir, customEncryptionKey) {
        this.logger.info('\n🔧 Exporting migrations table:');
        this.logger.info('==============================');
        const tablePrefix = this.dataSource.options.entityPrefix || '';
        const migrationsTableName = `${tablePrefix}migrations`;
        let systemTablesExported = 0;
        try {
            await this.dataSource.query(`SELECT id FROM ${this.dataSource.driver.escape(migrationsTableName)} LIMIT 1`);
            this.logger.info(`\n📊 Processing system table: ${migrationsTableName}`);
            await this.clearExistingEntityFiles(outputDir, 'migrations');
            const formattedTableName = this.dataSource.driver.escape(migrationsTableName);
            const allMigrations = await this.dataSource.query(`SELECT * FROM ${formattedTableName}`);
            const fileName = 'migrations.jsonl';
            const filePath = (0, backend_common_1.safeJoinPath)(outputDir, fileName);
            const migrationsJsonl = allMigrations
                .map((migration) => JSON.stringify(migration))
                .join('\n');
            await (0, promises_1.appendFile)(filePath, await this.cipher.encryptV2(migrationsJsonl ?? '' + '\n', customEncryptionKey), 'utf8');
            this.logger.info(`   ✅ Completed export for ${migrationsTableName}: ${allMigrations.length} entities in 1 file`);
            systemTablesExported = 1;
        }
        catch (error) {
            this.logger.info(`   ⚠️  Migrations table ${migrationsTableName} not found or not accessible, skipping...`, { error });
        }
        return systemTablesExported;
    }
    async loadDataTableIds() {
        const tablePrefix = this.dataSource.options.entityPrefix || '';
        const dataTableTableName = `${tablePrefix}data_table`;
        let dataTables;
        try {
            dataTables = await this.dataSource.query(`SELECT id FROM ${this.dataSource.driver.escape(dataTableTableName)}`);
        }
        catch (error) {
            this.logger.info(`   ⚠️  ${dataTableTableName} registry not found, skipping data-table row export...`, { error });
            return [];
        }
        if (dataTables.length === 0) {
            this.logger.info('   ℹ️  No data tables found, nothing to export.');
            return [];
        }
        return dataTables.map((t) => t.id);
    }
    async exportSingleDataTable(dataTableId, outputDir, customEncryptionKey) {
        const dbType = this.dataSource.options.type;
        const userTableName = (0, sql_utils_1.toTableName)(dataTableId);
        const fileBaseName = `${data_table_export_constants_1.DATA_TABLE_ROWS_FILE_PREFIX}${dataTableId}`;
        this.logger.info(`\n📊 Processing data table: ${userTableName}`);
        await this.clearExistingEntityFiles(outputDir, fileBaseName);
        const idCol = (0, sql_utils_1.quoteIdentifier)('id', dbType);
        const escapedUserTable = (0, sql_utils_1.quoteIdentifier)(userTableName, dbType);
        const pageSize = 500;
        const entitiesPerFile = 500;
        let lastId = 0;
        let fileIndex = 1;
        let currentFileEntityCount = 0;
        let totalEntityCount = 0;
        let hasNextPage = true;
        do {
            let pageRows;
            try {
                pageRows = await this.dataSource.query(`SELECT * FROM ${escapedUserTable} WHERE ${idCol} > ${lastId} ORDER BY "id" LIMIT ${pageSize}`);
            }
            catch (error) {
                this.logger.warn(`   ⚠️  Could not read rows from ${userTableName}; skipping. The dynamic table may be missing on the source instance.`, { error });
                break;
            }
            if (pageRows.length === 0)
                break;
            const targetFileIndex = Math.floor(totalEntityCount / entitiesPerFile) + 1;
            const fileName = targetFileIndex === 1
                ? `${fileBaseName}.jsonl`
                : `${fileBaseName}.${targetFileIndex}.jsonl`;
            const filePath = (0, backend_common_1.safeJoinPath)(outputDir, fileName);
            if (targetFileIndex > fileIndex) {
                this.logger.info(`   ✅ Completed file ${fileIndex}: ${currentFileEntityCount} rows`);
                fileIndex = targetFileIndex;
                currentFileEntityCount = 0;
            }
            const rowsJsonl = pageRows.map((row) => JSON.stringify(row)).join('\n');
            await (0, promises_1.appendFile)(filePath, (await this.cipher.encryptV2(rowsJsonl, customEncryptionKey)) + '\n', 'utf8');
            const lastRowId = Number(pageRows[pageRows.length - 1].id);
            if (!Number.isFinite(lastRowId)) {
                throw new Error(`Unexpected non-numeric id in ${userTableName}; cannot continue keyset pagination`);
            }
            lastId = lastRowId;
            totalEntityCount += pageRows.length;
            currentFileEntityCount += pageRows.length;
            this.logger.info(`      Fetched ${pageRows.length} rows (last id: ${lastId}, total: ${totalEntityCount})`);
            hasNextPage = pageRows.length >= pageSize;
        } while (hasNextPage);
        if (currentFileEntityCount > 0) {
            this.logger.info(`   ✅ Completed file ${fileIndex}: ${currentFileEntityCount} rows`);
        }
        this.logger.info(`   ✅ Completed export for ${userTableName}: ${totalEntityCount} rows in ${fileIndex} file(s)`);
        return totalEntityCount;
    }
    async exportDataTableUserTables(outputDir, customEncryptionKey) {
        this.logger.info('\n📚 Exporting data table user rows:');
        this.logger.info('==================================');
        const dataTableIds = await this.loadDataTableIds();
        if (dataTableIds.length === 0) {
            return { totalTables: 0, totalRows: 0 };
        }
        let totalRows = 0;
        for (const dataTableId of dataTableIds) {
            totalRows += await this.exportSingleDataTable(dataTableId, outputDir, customEncryptionKey);
        }
        this.logger.info(`\n📊 Data table row export summary: ${dataTableIds.length} table(s), ${totalRows} row(s)`);
        return { totalTables: dataTableIds.length, totalRows };
    }
    async exportEntities(outputDir, excludedTables = new Set(), keyFilePath, options = {}) {
        const { includeDataTableRows = true } = options;
        this.logger.info('\n⚠️⚠️ This feature is currently under development. ⚠️⚠️');
        (0, validate_database_type_1.validateDbTypeForExportEntities)(this.dataSource.options.type);
        this.logger.info('\n🚀 Starting entity export...');
        this.logger.info(`📁 Output directory: ${outputDir}`);
        let customEncryptionKey;
        if (keyFilePath) {
            try {
                const keyFileContent = await (0, promises_1.readFile)(keyFilePath, 'utf8');
                customEncryptionKey = keyFileContent.trim();
                this.logger.info(`🔑 Using custom encryption key from: ${keyFilePath}`);
            }
            catch (error) {
                throw new Error(`Failed to read encryption key file at ${keyFilePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        await (0, promises_1.rm)(outputDir, { recursive: true }).catch(() => { });
        await (0, promises_1.mkdir)(outputDir, { recursive: true });
        const entityMetadatas = this.dataSource.entityMetadatas;
        this.logger.info('\n📋 Exporting entities from all tables:');
        this.logger.info('====================================');
        let totalTablesProcessed = 0;
        let totalEntitiesExported = 0;
        const pageSize = 500;
        const entitiesPerFile = 500;
        await this.exportMigrationsTable(outputDir, customEncryptionKey);
        if (includeDataTableRows) {
            const dataTableRowsExported = await this.exportDataTableUserTables(outputDir, customEncryptionKey);
            totalEntitiesExported += dataTableRowsExported.totalRows;
            totalTablesProcessed += dataTableRowsExported.totalTables;
        }
        else {
            this.logger.info('\nℹ️  Skipping data-table row export (only schemas will be in the archive).');
        }
        for (const metadata of entityMetadatas) {
            const tableName = metadata.tableName;
            if (excludedTables.has(tableName)) {
                this.logger.info(`   💭 Skipping table: ${tableName} (${metadata.name}) as it exists as an exclusion`);
                continue;
            }
            const entityName = metadata.name.toLowerCase();
            this.logger.info(`\n📊 Processing table: ${tableName} (${entityName})`);
            await this.clearExistingEntityFiles(outputDir, entityName);
            const columnNames = metadata.columns.map((col) => col.databaseName);
            const columns = columnNames.map(this.dataSource.driver.escape).join(', ');
            this.logger.info(`   💭 Columns: ${columnNames.join(', ')}`);
            let offset = 0;
            let totalEntityCount = 0;
            let hasNextPage = true;
            let fileIndex = 1;
            let currentFileEntityCount = 0;
            do {
                const formattedTableName = this.dataSource.driver.escape(tableName);
                const pageEntities = await this.dataSource.query(`SELECT ${columns} FROM ${formattedTableName} LIMIT ${pageSize} OFFSET ${offset}`);
                if (pageEntities.length === 0) {
                    this.logger.info(`      No more entities available at offset ${offset}`);
                    hasNextPage = false;
                    break;
                }
                const targetFileIndex = Math.floor(totalEntityCount / entitiesPerFile) + 1;
                const fileName = targetFileIndex === 1 ? `${entityName}.jsonl` : `${entityName}.${targetFileIndex}.jsonl`;
                const filePath = (0, backend_common_1.safeJoinPath)(outputDir, fileName);
                if (targetFileIndex > fileIndex) {
                    this.logger.info(`   ✅ Completed file ${fileIndex}: ${currentFileEntityCount} entities`);
                    fileIndex = targetFileIndex;
                    currentFileEntityCount = 0;
                }
                const entitiesJsonl = pageEntities
                    .map((entity) => JSON.stringify(entity))
                    .join('\n');
                await (0, promises_1.appendFile)(filePath, (await this.cipher.encryptV2(entitiesJsonl, customEncryptionKey)) + '\n', 'utf8');
                totalEntityCount += pageEntities.length;
                currentFileEntityCount += pageEntities.length;
                offset += pageEntities.length;
                this.logger.info(`      Fetched page containing ${pageEntities.length} entities (page size: ${pageSize}, offset: ${offset - pageEntities.length}, total processed: ${totalEntityCount})`);
                if (pageEntities.length < pageSize) {
                    this.logger.info(`      Reached end of dataset (got ${pageEntities.length} < ${pageSize} requested)`);
                    hasNextPage = false;
                }
            } while (hasNextPage);
            if (currentFileEntityCount > 0) {
                this.logger.info(`   ✅ Completed file ${fileIndex}: ${currentFileEntityCount} entities`);
            }
            this.logger.info(`   ✅ Completed export for ${tableName}: ${totalEntityCount} entities in ${fileIndex} file(s)`);
            totalTablesProcessed++;
            totalEntitiesExported += totalEntityCount;
        }
        const zipPath = (0, backend_common_1.safeJoinPath)(outputDir, 'entities.zip');
        this.logger.info(`\n🗜️  Compressing export to ${zipPath}...`);
        await (0, compression_util_1.compressFolder)(outputDir, zipPath, {
            level: 6,
            exclude: ['*.log'],
            includeHidden: false,
        });
        this.logger.info('🗑️  Cleaning up individual entity files...');
        const files = await (0, promises_1.readdir)(outputDir);
        for (const file of files) {
            if (file.endsWith('.jsonl') && file !== 'entities.zip') {
                await (0, promises_1.rm)((0, backend_common_1.safeJoinPath)(outputDir, file));
            }
        }
        this.logger.info('\n📊 Export Summary:');
        this.logger.info(`   Tables processed: ${totalTablesProcessed}`);
        this.logger.info(`   Total entities exported: ${totalEntitiesExported}`);
        this.logger.info(`   Output directory: ${outputDir}`);
        this.logger.info(`   Compressed archive: ${zipPath}`);
        this.logger.info('✅ Task completed successfully! \n');
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, typeorm_1.DataSource, n8n_core_1.Cipher])
], ExportService);
//# sourceMappingURL=export.service.js.map