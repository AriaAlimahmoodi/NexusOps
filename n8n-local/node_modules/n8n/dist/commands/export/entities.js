"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportEntitiesCommand = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const zod_1 = require("zod");
const export_service_1 = require("../../services/export.service");
const base_command_1 = require("../base-command");
const flagsSchema = zod_1.z.object({
    outputDir: zod_1.z
        .string()
        .describe('Output directory path')
        .default((0, backend_common_1.safeJoinPath)(__dirname, './outputs')),
    includeExecutionHistoryDataTables: zod_1.z.coerce
        .boolean()
        .describe('Include execution history data tables, these are excluded by default as they can be very large')
        .default(false),
    includeDataTableRows: zod_1.z.coerce
        .boolean()
        .describe('Include user-data table row contents. When false, only the data-table schemas (registry rows) are exported.')
        .default(true),
    keyFile: zod_1.z
        .string()
        .describe('Optional path to a file containing a custom encryption key')
        .optional(),
});
let ExportEntitiesCommand = class ExportEntitiesCommand extends base_command_1.BaseCommand {
    async run() {
        const outputDir = this.flags.outputDir;
        const excludedDataTables = new Set();
        const keyFilePath = this.flags.keyFile ? (0, backend_common_1.safeJoinPath)(this.flags.keyFile) : undefined;
        if (!this.flags.includeExecutionHistoryDataTables) {
            excludedDataTables.add('execution_annotation_tags');
            excludedDataTables.add('execution_annotations');
            excludedDataTables.add('execution_data');
            excludedDataTables.add('execution_entity');
            excludedDataTables.add('execution_metadata');
        }
        await di_1.Container.get(export_service_1.ExportService).exportEntities(outputDir, excludedDataTables, keyFilePath, {
            includeDataTableRows: this.flags.includeDataTableRows,
        });
    }
    catch(error) {
        this.logger.error('❌ Error exporting entities. See log messages for details. \n');
        this.logger.error('Error details:');
        this.logger.error('\n====================================\n');
        this.logger.error(`${error.message} \n`);
    }
};
exports.ExportEntitiesCommand = ExportEntitiesCommand;
exports.ExportEntitiesCommand = ExportEntitiesCommand = __decorate([
    (0, decorators_1.Command)({
        name: 'export:entities',
        description: 'Export database entities to JSON files',
        examples: [
            '',
            '--outputDir=./exports',
            '--outputDir=/path/to/backup',
            '--includeExecutionHistoryDataTables=true',
            '--includeDataTableRows=false',
            '--keyFile=/path/to/key.txt',
            '--outputDir=./exports --keyFile=/path/to/key.txt',
        ],
        flagsSchema,
    })
], ExportEntitiesCommand);
//# sourceMappingURL=entities.js.map