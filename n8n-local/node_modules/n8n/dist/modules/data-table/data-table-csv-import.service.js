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
exports.DataTableCsvImportService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const csv_parser_service_1 = require("./csv-parser.service");
const data_table_file_cleanup_service_1 = require("./data-table-file-cleanup.service");
const data_table_file_upload_error_1 = require("./errors/data-table-file-upload.error");
const data_table_validation_error_1 = require("./errors/data-table-validation.error");
let DataTableCsvImportService = class DataTableCsvImportService {
    constructor(csvParserService, fileCleanupService, logger) {
        this.csvParserService = csvParserService;
        this.fileCleanupService = fileCleanupService;
        this.logger = logger.scoped('data-table-csv-import');
    }
    async buildRowsForNewTable(fileId, hasHeaders, tableColumns, dtoColumns) {
        try {
            const columnMapping = await this.buildColumnMappingForNewTable(fileId, hasHeaders, tableColumns, dtoColumns);
            const csvRows = await this.csvParserService.parseFileData(fileId, hasHeaders);
            return this.transformRows(csvRows, columnMapping);
        }
        catch (error) {
            this.logger.error('Failed to import data from CSV file', { error, fileId });
            throw new data_table_file_upload_error_1.FileUploadError(error instanceof Error ? error.message : 'Failed to read CSV file');
        }
    }
    async validateAndBuildRowsForExistingTable(fileId, tableColumns) {
        try {
            const tableColumnNames = new Set(tableColumns.map((col) => col.name));
            const { metadata: csvMetadata, rows: csvRows } = await this.csvParserService.parseFileWithData(fileId);
            const { matchedColumns, systemColumnsIgnored } = this.matchColumns(csvMetadata.columns, tableColumnNames);
            const mapping = new Map(matchedColumns.map((col) => [col, col]));
            return {
                rows: this.transformRows(csvRows, mapping),
                systemColumnsIgnored,
            };
        }
        catch (error) {
            if (error instanceof data_table_validation_error_1.DataTableValidationError)
                throw error;
            this.logger.error('Failed to import CSV to existing table', { error, fileId });
            throw new data_table_file_upload_error_1.FileUploadError(error instanceof Error ? error.message : 'Failed to import CSV file');
        }
    }
    async cleanupFile(fileId) {
        await this.fileCleanupService.deleteFile(fileId);
    }
    matchColumns(csvColumns, tableColumnNames) {
        const systemColumnsIgnored = [];
        const unrecognizedColumns = [];
        const matchedColumns = [];
        for (const csvCol of csvColumns) {
            if (n8n_workflow_1.DATA_TABLE_SYSTEM_COLUMNS.includes(csvCol.name)) {
                systemColumnsIgnored.push(csvCol.name);
            }
            else if (tableColumnNames.has(csvCol.name)) {
                matchedColumns.push(csvCol.name);
            }
            else {
                unrecognizedColumns.push(csvCol.name);
            }
        }
        if (unrecognizedColumns.length > 0) {
            throw new data_table_validation_error_1.DataTableValidationError(`CSV contains columns not found in the data table: ${unrecognizedColumns.join(', ')}. Remove them and try again.`);
        }
        if (matchedColumns.length === 0) {
            throw new data_table_validation_error_1.DataTableValidationError('No matching columns found between CSV and data table. CSV columns must match table column names exactly.');
        }
        return { matchedColumns, systemColumnsIgnored };
    }
    transformRows(csvRows, columnMapping) {
        return csvRows.map((csvRow) => {
            const transformedRow = {};
            for (const [csvColName, tableColName] of columnMapping) {
                const value = csvRow[csvColName];
                transformedRow[tableColName] = value === undefined || value === '' ? null : value;
            }
            return transformedRow;
        });
    }
    async buildColumnMappingForNewTable(fileId, hasHeaders, tableColumns, dtoColumns) {
        const columnMapping = new Map();
        const hasCsvColumnNames = dtoColumns?.some((c) => c.csvColumnName);
        if (hasCsvColumnNames) {
            const tableColByName = new Map(tableColumns.map((tc) => [tc.name, tc.name]));
            for (const dtoCol of dtoColumns) {
                if (dtoCol.csvColumnName) {
                    const tableName = tableColByName.get(dtoCol.name);
                    if (tableName) {
                        columnMapping.set(dtoCol.csvColumnName, tableName);
                    }
                }
            }
        }
        else {
            const csvMetadata = await this.csvParserService.parseFile(fileId, hasHeaders);
            csvMetadata.columns.forEach((csvColumn, index) => {
                if (tableColumns[index]) {
                    columnMapping.set(csvColumn.name, tableColumns[index].name);
                }
            });
        }
        return columnMapping;
    }
};
exports.DataTableCsvImportService = DataTableCsvImportService;
exports.DataTableCsvImportService = DataTableCsvImportService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [csv_parser_service_1.CsvParserService, data_table_file_cleanup_service_1.DataTableFileCleanupService, backend_common_1.Logger])
], DataTableCsvImportService);
//# sourceMappingURL=data-table-csv-import.service.js.map