"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportedTypesForImport = exports.supportedTypesForExport = void 0;
exports.validateDbTypeForExportEntities = validateDbTypeForExportEntities;
exports.validateDbTypeForImportEntities = validateDbTypeForImportEntities;
exports.supportedTypesForExport = [
    'sqlite',
    'sqlite-pooled',
    'sqlite-memory',
    'postgres',
    'postgresql',
];
exports.supportedTypesForImport = [
    'sqlite',
    'sqlite-pooled',
    'sqlite-memory',
    'postgres',
    'postgresql',
];
function validateDbTypeForExportEntities(dbType) {
    if (!exports.supportedTypesForExport.includes(dbType.toLowerCase())) {
        throw new Error(`Unsupported database type: ${dbType}. Supported types: ${exports.supportedTypesForExport.join(', ')}`);
    }
}
function validateDbTypeForImportEntities(dbType) {
    if (!exports.supportedTypesForImport.includes(dbType.toLowerCase())) {
        throw new Error(`Unsupported database type: ${dbType}. Supported types: ${exports.supportedTypesForImport.join(', ')}`);
    }
}
//# sourceMappingURL=validate-database-type.js.map