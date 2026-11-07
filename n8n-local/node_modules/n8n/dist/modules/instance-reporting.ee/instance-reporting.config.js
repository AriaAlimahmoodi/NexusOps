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
exports.InstanceReportingConfig = void 0;
const config_1 = require("@n8n/config");
let InstanceReportingConfig = class InstanceReportingConfig {
    constructor() {
        this.instanceReportingLabel = '';
        this.instanceReportingBaseUrl = '';
        this.instanceReportingAuthToken = '';
    }
};
exports.InstanceReportingConfig = InstanceReportingConfig;
__decorate([
    (0, config_1.Env)('N8N_INSTANCE_REPORTING_LABEL'),
    __metadata("design:type", String)
], InstanceReportingConfig.prototype, "instanceReportingLabel", void 0);
__decorate([
    (0, config_1.Env)('N8N_INSTANCE_REPORTING_BASE_URL'),
    __metadata("design:type", String)
], InstanceReportingConfig.prototype, "instanceReportingBaseUrl", void 0);
__decorate([
    (0, config_1.Env)('N8N_INSTANCE_REPORTING_AUTH_TOKEN'),
    __metadata("design:type", String)
], InstanceReportingConfig.prototype, "instanceReportingAuthToken", void 0);
exports.InstanceReportingConfig = InstanceReportingConfig = __decorate([
    config_1.Config
], InstanceReportingConfig);
//# sourceMappingURL=instance-reporting.config.js.map