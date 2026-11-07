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
exports.DataTableSizeValidator = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const bytes_1 = require("@n8n/utils/number/bytes");
const telemetry_1 = require("../../telemetry");
const data_table_validation_error_1 = require("./errors/data-table-validation.error");
let DataTableSizeValidator = class DataTableSizeValidator {
    constructor(globalConfig, telemetry) {
        this.globalConfig = globalConfig;
        this.telemetry = telemetry;
        this.pendingCheck = null;
    }
    shouldRefresh(now) {
        if (!this.lastCheck ||
            !this.cachedSizeData ||
            now.getTime() - this.lastCheck.getTime() >= this.globalConfig.dataTable.sizeCheckCacheDuration) {
            return true;
        }
        return false;
    }
    async getCachedSizeData(fetchSizeDataFn, now = new Date()) {
        if (this.pendingCheck) {
            this.cachedSizeData = await this.pendingCheck;
        }
        else {
            if (this.shouldRefresh(now)) {
                this.pendingCheck = fetchSizeDataFn();
                try {
                    this.cachedSizeData = await this.pendingCheck;
                    this.lastCheck = now;
                }
                finally {
                    this.pendingCheck = null;
                }
            }
        }
        return this.cachedSizeData;
    }
    async validateSize(fetchSizeFn, now = new Date()) {
        const size = await this.getCachedSizeData(fetchSizeFn, now);
        if (size.totalBytes >= this.globalConfig.dataTable.maxSize) {
            this.telemetry.track('User hit data table storage limit', {
                total_bytes: size.totalBytes,
                max_bytes: this.globalConfig.dataTable.maxSize,
            });
            throw new data_table_validation_error_1.DataTableValidationError(`Data table size limit exceeded: ${(0, bytes_1.toMb)(size.totalBytes)}MB used, limit is ${(0, bytes_1.toMb)(this.globalConfig.dataTable.maxSize)}MB`);
        }
    }
    sizeToState(sizeBytes) {
        const warningThreshold = this.globalConfig.dataTable.warningThreshold ??
            Math.floor(0.8 * this.globalConfig.dataTable.maxSize);
        if (sizeBytes >= this.globalConfig.dataTable.maxSize) {
            return 'error';
        }
        else if (sizeBytes >= warningThreshold) {
            return 'warn';
        }
        return 'ok';
    }
    async getSizeStatus(fetchSizeFn, now = new Date()) {
        const size = await this.getCachedSizeData(fetchSizeFn, now);
        return this.sizeToState(size.totalBytes);
    }
    reset() {
        this.lastCheck = undefined;
        this.cachedSizeData = undefined;
        this.pendingCheck = null;
    }
};
exports.DataTableSizeValidator = DataTableSizeValidator;
exports.DataTableSizeValidator = DataTableSizeValidator = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, telemetry_1.Telemetry])
], DataTableSizeValidator);
//# sourceMappingURL=data-table-size-validator.service.js.map