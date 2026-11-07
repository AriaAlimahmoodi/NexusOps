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
exports.InstanceReportingTask = void 0;
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const instance_reporting_service_1 = require("./instance-reporting.service");
let InstanceReportingTask = class InstanceReportingTask {
    constructor(reportingService) {
        this.reportingService = reportingService;
        this.name = 'instance-reporting';
        this.schedule = (0, decorators_1.intervalFromSeconds)(15 * constants_1.Time.minutes.toSeconds);
        this.target = (0, decorators_1.clusterTarget)({
            scheduler: { retryOnFailure: false },
            leaderTimer: { runOnTakeover: true },
        });
    }
    async run() {
        await this.reportingService.sendDueReport(new Date());
    }
};
exports.InstanceReportingTask = InstanceReportingTask;
exports.InstanceReportingTask = InstanceReportingTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [instance_reporting_service_1.InstanceReportingService])
], InstanceReportingTask);
//# sourceMappingURL=instance-reporting.task.js.map