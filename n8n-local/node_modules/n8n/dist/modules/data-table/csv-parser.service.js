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
exports.CsvParserService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const csv_parse_1 = require("csv-parse");
const fs_1 = require("fs");
let CsvParserService = class CsvParserService {
    constructor(globalConfig) {
        this.globalConfig = globalConfig;
        this.DEFAULT_COLUMN_PREFIX = 'Column_';
        this.TYPE_INFERENCE_SAMPLE_SIZE = 100;
        this.uploadDir = this.globalConfig.dataTable.uploadDir;
    }
    generateColumnNames(columnCount) {
        return Array.from({ length: columnCount }, (_, i) => `${this.DEFAULT_COLUMN_PREFIX}${i + 1}`);
    }
    mapValuesToColumns(row, columnNames) {
        const rowObject = {};
        row.forEach((value, index) => {
            rowObject[columnNames[index]] = value;
        });
        return rowObject;
    }
    createParserOptions(hasHeaders) {
        return {
            columns: hasHeaders ? true : false,
            skip_empty_lines: true,
            bom: true,
        };
    }
    trimColumnNames(columns) {
        return columns.map((h) => h.trim());
    }
    normalizeRow(row, hasHeaders, columnNames) {
        if (!hasHeaders && Array.isArray(row)) {
            return this.mapValuesToColumns(row, columnNames);
        }
        else if (!Array.isArray(row)) {
            return row;
        }
        return null;
    }
    collectTypeSamples(rowObject, columnNames, firstNonEmptyValues) {
        for (const colName of columnNames) {
            if (!firstNonEmptyValues.has(colName)) {
                const value = rowObject[colName];
                if (value?.trim()) {
                    firstNonEmptyValues.set(colName, value);
                }
            }
        }
    }
    buildColumnMetadata(columnNames, firstNonEmptyValues) {
        return columnNames.map((columnName) => {
            const detectedType = this.inferColumnType(firstNonEmptyValues.get(columnName));
            return {
                name: columnName,
                type: detectedType,
                compatibleTypes: this.getCompatibleTypes(detectedType),
            };
        });
    }
    async parseCsvFile(fileId, hasHeaders, onRow, onEnd) {
        const filePath = (0, backend_common_1.safeJoinPath)(this.uploadDir, fileId);
        let columnNames = [];
        let rowCount = 0;
        return await new Promise((resolve, reject) => {
            const parser = (0, csv_parse_1.parse)({
                ...this.createParserOptions(hasHeaders),
                ...(hasHeaders && {
                    columns: (header) => {
                        columnNames = this.trimColumnNames(header);
                        return columnNames;
                    },
                }),
            })
                .on('data', (row) => {
                rowCount++;
                if (!hasHeaders && Array.isArray(row) && columnNames.length === 0) {
                    columnNames = this.generateColumnNames(row.length);
                }
                const rowObject = this.normalizeRow(row, hasHeaders, columnNames);
                if (!rowObject)
                    return;
                onRow(rowObject, columnNames, rowCount);
            })
                .on('end', () => resolve(onEnd(columnNames, rowCount)))
                .on('error', reject);
            (0, fs_1.createReadStream)(filePath).on('error', reject).pipe(parser);
        });
    }
    async parseFile(fileId, hasHeaders = true) {
        const firstNonEmptyValues = new Map();
        return await this.parseCsvFile(fileId, hasHeaders, (rowObject, colNames, rowNumber) => {
            if (rowNumber <= this.TYPE_INFERENCE_SAMPLE_SIZE) {
                this.collectTypeSamples(rowObject, colNames, firstNonEmptyValues);
            }
        }, (colNames, totalRows) => {
            const columns = this.buildColumnMetadata(colNames, firstNonEmptyValues);
            return { rowCount: totalRows, columnCount: columns.length, columns };
        });
    }
    async parseFileData(fileId, hasHeaders = true) {
        const rows = [];
        return await this.parseCsvFile(fileId, hasHeaders, (rowObject) => rows.push(rowObject), () => rows);
    }
    async parseFileWithData(fileId, hasHeaders = true) {
        const rows = [];
        return await this.parseCsvFile(fileId, hasHeaders, (rowObject) => rows.push(rowObject), (colNames) => {
            const columns = colNames.map((name) => ({ name, type: 'string' }));
            return {
                metadata: { rowCount: rows.length, columnCount: columns.length, columns },
                rows,
            };
        });
    }
    getCompatibleTypes(detectedType) {
        switch (detectedType) {
            case 'date':
                return ['date', 'string'];
            case 'number':
                return ['number', 'string'];
            case 'boolean':
                return ['boolean', 'string'];
            case 'string':
                return ['string'];
            default:
                return ['string'];
        }
    }
    inferColumnType(value) {
        if (!value?.trim()) {
            return 'string';
        }
        const trimmedValue = value.trim();
        const lowerValue = trimmedValue.toLowerCase();
        if (lowerValue === 'true' || lowerValue === 'false') {
            return 'boolean';
        }
        if (!Number.isNaN(Number(trimmedValue))) {
            return 'number';
        }
        if (this.isDate(trimmedValue)) {
            return 'date';
        }
        return 'string';
    }
    isDate(value) {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
            const datePatterns = [
                /^\d{4}-\d{2}-\d{2}/,
                /^\d{4}\/\d{2}\/\d{2}/,
                /^\d{2}\/\d{2}\/\d{4}/,
                /^\d{2}-\d{2}-\d{4}/,
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,
            ];
            return datePatterns.some((pattern) => pattern.test(value));
        }
        return false;
    }
};
exports.CsvParserService = CsvParserService;
exports.CsvParserService = CsvParserService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig])
], CsvParserService);
//# sourceMappingURL=csv-parser.service.js.map