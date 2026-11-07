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
exports.InstanceReportingController = void 0;
const decorators_1 = require("@n8n/decorators");
const instance_monitoring_report_repository_1 = require("./database/repositories/instance-monitoring-report.repository");
let InstanceReportingController = class InstanceReportingController {
    constructor(reportRepository) {
        this.reportRepository = reportRepository;
    }
    async getStatus() {
        const lastDelivery = await this.reportRepository.findLastDeliveryTime();
        return { lastSuccessfulReport: lastDelivery?.toISOString() ?? null };
    }
};
exports.InstanceReportingController = InstanceReportingController;
__decorate([
    (0, decorators_1.Get)('/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InstanceReportingController.prototype, "getStatus", null);
exports.InstanceReportingController = InstanceReportingController = __decorate([
    (0, decorators_1.RestController)('/instance-reporting'),
    __metadata("design:paramtypes", [instance_monitoring_report_repository_1.InstanceMonitoringReportRepository])
], InstanceReportingController);
//# sourceMappingURL=instance-reporting.controller.js.map