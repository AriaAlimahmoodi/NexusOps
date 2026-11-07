"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportEntitiesCommand = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const zod_1 = require("zod");
const import_service_1 = require("../../services/import.service");
const base_command_1 = require("../base-command");
const flagsSchema = zod_1.z.object({
    inputDir: zod_1.z
        .string()
        .describe('Input directory that holds output files for import')
        .default('./outputs'),
    truncateTables: zod_1.z.coerce.boolean().describe('Truncate tables before import').default(false),
    keyFile: zod_1.z
        .string()
        .describe('Optional path to a file containing a custom encryption key')
        .optional(),
    skipMigrationChecks: zod_1.z.coerce
        .boolean()
        .describe('Skip migration validation checks')
        .default(false),
    skipTogglingForeignKeyConstraints: zod_1.z.coerce
        .boolean()
        .describe('Skip disabling foreign key constraints')
        .default(false),
});
let ImportEntitiesCommand = class ImportEntitiesCommand extends base_command_1.BaseCommand {
    async run() {
        const inputDir = this.flags.inputDir;
        const truncateTables = this.flags.truncateTables;
        const keyFilePath = this.flags.keyFile ? (0, backend_common_1.safeJoinPath)(this.flags.keyFile) : undefined;
        const skipMigrationChecks = this.flags.skipMigrationChecks ?? false;
        const skipTogglingForeignKeyConstraints = this.flags.skipTogglingForeignKeyConstraints ?? false;
        this.logger.info('\n⚠️⚠️ This feature is currently under development. ⚠️⚠️');
        this.logger.info('\n🚀 Starting entity import...');
        this.logger.info(`📁 Input directory: ${inputDir}`);
        this.logger.info(`🗑️  Truncate tables: ${truncateTables}`);
        if (skipMigrationChecks) {
            this.logger.info('⏭️  Skipping migration checks');
        }
        if (skipTogglingForeignKeyConstraints) {
            this.logger.info('⏭️  Skipping disabling foreign key constraints');
        }
        await di_1.Container.get(import_service_1.ImportService).importEntities(inputDir, truncateTables, keyFilePath, skipMigrationChecks, skipTogglingForeignKeyConstraints);
    }
    catch(error) {
        this.logger.error('❌ Error importing entities. See log messages for details. \n');
        this.logger.error('Error details:');
        this.logger.error('\n====================================\n');
        this.logger.error(`${error.message} \n`);
    }
};
exports.ImportEntitiesCommand = ImportEntitiesCommand;
exports.ImportEntitiesCommand = ImportEntitiesCommand = __decorate([
    (0, decorators_1.Command)({
        name: 'import:entities',
        description: 'Import database entities from JSON files',
        examples: [
            '',
            '--inputDir=./exports',
            '--inputDir=/path/to/backup',
            '--truncateTables',
            '--inputDir=./exports --truncateTables',
            '--keyFile=/path/to/key.txt',
            '--inputDir=./exports --keyFile=/path/to/key.txt',
            '--skipMigrationChecks',
            '--inputDir=./exports --skipMigrationChecks',
        ],
        flagsSchema,
    })
], ImportEntitiesCommand);
//# sourceMappingURL=entities.js.map