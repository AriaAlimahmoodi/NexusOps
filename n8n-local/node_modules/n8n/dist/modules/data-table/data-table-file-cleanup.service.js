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
exports.DataTableFileCleanupService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const fs_1 = require("fs");
let DataTableFileCleanupService = class DataTableFileCleanupService {
    constructor(globalConfig, logger) {
        this.globalConfig = globalConfig;
        this.logger = logger;
        this.uploadDir = this.globalConfig.dataTable.uploadDir;
        this.logger = this.logger.scoped('data-table');
    }
    isErrnoException(error) {
        return (typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            typeof error.code === 'string');
    }
    isNotFound(error) {
        return this.isErrnoException(error) && error.code === 'ENOENT';
    }
    async cleanupOrphanedFiles(signal) {
        let files;
        try {
            files = await fs_1.promises.readdir(this.uploadDir);
        }
        catch (error) {
            if (this.isNotFound(error))
                return;
            throw error;
        }
        const now = Date.now();
        const maxAge = this.globalConfig.dataTable.fileMaxAgeMs;
        for (const file of files) {
            if (signal.aborted)
                break;
            const filePath = (0, backend_common_1.safeJoinPath)(this.uploadDir, file);
            try {
                const stats = await fs_1.promises.stat(filePath);
                const fileAge = now - stats.mtimeMs;
                if (fileAge > maxAge) {
                    await fs_1.promises.unlink(filePath);
                }
            }
            catch (error) {
                if (this.isNotFound(error))
                    continue;
                this.logger.warn('Could not delete an orphaned data table upload file', {
                    file,
                    error: (0, ensure_error_1.ensureError)(error).message,
                });
            }
        }
    }
    async deleteFile(fileId) {
        const filePath = (0, backend_common_1.safeJoinPath)(this.uploadDir, fileId);
        try {
            await fs_1.promises.unlink(filePath);
        }
        catch (error) {
            if (!this.isNotFound(error))
                throw error;
        }
    }
};
exports.DataTableFileCleanupService = DataTableFileCleanupService;
exports.DataTableFileCleanupService = DataTableFileCleanupService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, backend_common_1.Logger])
], DataTableFileCleanupService);
//# sourceMappingURL=data-table-file-cleanup.service.js.map