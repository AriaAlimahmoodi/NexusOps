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
exports.DataTableFileCleanupTask = void 0;
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const data_table_file_cleanup_service_1 = require("./data-table-file-cleanup.service");
let DataTableFileCleanupTask = class DataTableFileCleanupTask {
    constructor(globalConfig, fileCleanupService) {
        this.globalConfig = globalConfig;
        this.fileCleanupService = fileCleanupService;
        this.name = 'data-table-file-cleanup';
        this.schedule = (0, decorators_1.intervalFromMilliseconds)(this.globalConfig.dataTable.cleanupIntervalMs);
        this.target = (0, decorators_1.instanceTarget)(['main']);
    }
    async run(signal) {
        await this.fileCleanupService.cleanupOrphanedFiles(signal);
    }
};
exports.DataTableFileCleanupTask = DataTableFileCleanupTask;
exports.DataTableFileCleanupTask = DataTableFileCleanupTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, data_table_file_cleanup_service_1.DataTableFileCleanupService])
], DataTableFileCleanupTask);
//# sourceMappingURL=data-table-file-cleanup.task.js.map