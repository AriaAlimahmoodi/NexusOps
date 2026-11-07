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
exports.DataTableModule = void 0;
const backend_services_1 = require("@n8n/backend-services");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
let DataTableModule = class DataTableModule {
    async init() {
        await import('./data-table.controller.js');
        await import('./data-table-aggregate.controller.js');
        await import('./data-table-uploads.controller.js');
        const { DataTableService } = await import('./data-table.service.js');
        await di_1.Container.get(DataTableService).start();
        di_1.Container.get(backend_services_1.OwnershipTransferHandlerRegistry).register({
            resource: 'data-table',
            transferAll: async (fromProjectId, toProjectId, trx) => {
                await di_1.Container.get(DataTableService).transferDataTablesByProjectId(fromProjectId, toProjectId, trx);
            },
            deleteAll: async (projectId) => {
                await di_1.Container.get(DataTableService).deleteDataTableByProjectId(projectId);
            },
        });
        const { registerFavoriteResolver } = await import('./register-favorite-resolver.js');
        registerFavoriteResolver();
        const { DataTableAggregateService } = await import('./data-table-aggregate.service.js');
        await di_1.Container.get(DataTableAggregateService).start();
    }
    async systemTasks() {
        const { DataTableFileCleanupTask } = await import('./data-table-file-cleanup.task.js');
        return [DataTableFileCleanupTask];
    }
    async shutdown() {
        const { DataTableService } = await import('./data-table.service.js');
        await di_1.Container.get(DataTableService).shutdown();
        const { DataTableAggregateService } = await import('./data-table-aggregate.service.js');
        await di_1.Container.get(DataTableAggregateService).shutdown();
    }
    async entities() {
        const { DataTable } = await import('./data-table.entity.js');
        const { DataTableColumn } = await import('./data-table-column.entity.js');
        return [DataTable, DataTableColumn];
    }
    async context() {
        const { DataTableProxyService } = await import('./data-table-proxy.service.js');
        return { dataTableProxyProvider: di_1.Container.get(DataTableProxyService) };
    }
};
exports.DataTableModule = DataTableModule;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DataTableModule.prototype, "shutdown", null);
exports.DataTableModule = DataTableModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'data-table' })
], DataTableModule);
//# sourceMappingURL=data-table.module.js.map