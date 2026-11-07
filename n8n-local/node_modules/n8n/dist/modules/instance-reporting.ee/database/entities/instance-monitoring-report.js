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
exports.InstanceMonitoringReport = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let InstanceMonitoringReport = class InstanceMonitoringReport extends db_1.WithTimestamps {
};
exports.InstanceMonitoringReport = InstanceMonitoringReport;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], InstanceMonitoringReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", Object)
], InstanceMonitoringReport.prototype, "reportDate", void 0);
__decorate([
    (0, db_1.JsonColumn)(),
    __metadata("design:type", Array)
], InstanceMonitoringReport.prototype, "dataPoints", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, default: 'pending' }),
    __metadata("design:type", String)
], InstanceMonitoringReport.prototype, "status", void 0);
__decorate([
    (0, db_1.DateTimeColumn)({ nullable: true }),
    __metadata("design:type", Object)
], InstanceMonitoringReport.prototype, "deliveredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], InstanceMonitoringReport.prototype, "attempts", void 0);
__decorate([
    (0, db_1.DateTimeColumn)({ nullable: true }),
    __metadata("design:type", Object)
], InstanceMonitoringReport.prototype, "lastAttemptAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], InstanceMonitoringReport.prototype, "lastError", void 0);
exports.InstanceMonitoringReport = InstanceMonitoringReport = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Index)(['reportDate'], { unique: true, where: '"reportDate" IS NOT NULL' })
], InstanceMonitoringReport);
//# sourceMappingURL=instance-monitoring-report.js.map