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
exports.DataTableExporter = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const data_table_service_1 = require("../../../../modules/data-table/data-table.service");
const data_table_serializer_1 = require("./data-table.serializer");
const manifest_entry_1 = require("../../io/manifest-entry");
const requirement_source_1 = require("../requirement-source");
let DataTableExporter = class DataTableExporter {
    constructor(dataTableService, dataTableSerializer, moduleRegistry) {
        this.dataTableService = dataTableService;
        this.dataTableSerializer = dataTableSerializer;
        this.moduleRegistry = moduleRegistry;
    }
    async export(request) {
        if (request.requirements.length === 0) {
            return { entries: [], requirements: [] };
        }
        if (!this.moduleRegistry.isActive('data-table')) {
            throw new n8n_workflow_1.UserError('The package uses data tables, but the data-table module is disabled on this instance.');
        }
        const usageById = (0, requirement_source_1.groupRequirementUsage)(request.requirements, ({ dataTableId }) => dataTableId);
        const requestedIds = [...usageById.keys()];
        const dataTables = await this.dataTableService.findDataTablesByIdsForUser(requestedIds, request.user, ['dataTable:read']);
        this.assertAllRequestedDataTablesFound(requestedIds, dataTables);
        const entries = [];
        const requirements = [];
        for (const dataTable of dataTables) {
            entries.push(await (0, manifest_entry_1.writeManifestEntry)(request.writer, 'dataTables', (0, manifest_entry_1.projectScopedDirectory)('dataTables', dataTable.projectId, request.projectTargetsById), dataTable, this.dataTableSerializer.serialize(dataTable)));
            requirements.push({
                id: dataTable.id,
                name: dataTable.name,
                usedBy: usageById.get(dataTable.id)?.usedBy ?? [],
            });
        }
        return { entries, requirements };
    }
    assertAllRequestedDataTablesFound(requestedDataTableIds, foundDataTables) {
        const foundDataTableIds = new Set(foundDataTables.map(({ id }) => id));
        const missingDataTableIds = requestedDataTableIds.filter((id) => !foundDataTableIds.has(id));
        if (missingDataTableIds.length > 0) {
            const displayedDataTableIds = missingDataTableIds.slice(0, 20);
            const omittedCount = missingDataTableIds.length - displayedDataTableIds.length;
            throw new n8n_workflow_1.UserError(`${missingDataTableIds.length} data table(s) not found or not accessible. Export aborted.`, {
                description: `Missing data table IDs: ${displayedDataTableIds.join(', ')}${omittedCount > 0 ? `, and ${omittedCount} more` : ''}`,
            });
        }
    }
};
exports.DataTableExporter = DataTableExporter;
exports.DataTableExporter = DataTableExporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [data_table_service_1.DataTableService, data_table_serializer_1.DataTableSerializer, backend_common_1.ModuleRegistry])
], DataTableExporter);
//# sourceMappingURL=data-table.exporter.js.map