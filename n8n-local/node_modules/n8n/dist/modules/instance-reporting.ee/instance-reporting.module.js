"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceReportingModule = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
let InstanceReportingModule = class InstanceReportingModule {
    async init() {
        await import('./instance-reporting.controller.js');
        if (di_1.Container.get(backend_common_1.ModulesConfig).disabledModules.includes('insights')) {
            throw new n8n_workflow_1.UserError('The `instance-reporting` module requires the `insights` module, but it is listed in N8N_DISABLED_MODULES. Remove `insights` from N8N_DISABLED_MODULES or remove `instance-reporting` from N8N_ENABLED_MODULES.');
        }
        const logger = di_1.Container.get(backend_common_1.Logger).scoped('instance-reporting');
        if (!(await this.hasReceiver())) {
            logger.warn('Instance reporting is enabled but N8N_INSTANCE_REPORTING_BASE_URL is unset, so no reports will be sent');
        }
        else if (!(await this.hasCredential())) {
            logger.warn('Instance reporting is enabled but this instance has no license certificate, so no reports will be sent. The receiver accepts reports only from licensed instances. Set N8N_LICENSE_CERT, activate a license, or set N8N_INSTANCE_REPORTING_AUTH_TOKEN.');
        }
    }
    async systemTasks() {
        if (await this.isConfigured()) {
            const { InstanceReportingTask } = await import('./instance-reporting.task.js');
            return [InstanceReportingTask];
        }
        return [];
    }
    async settings() {
        if (!(await this.isConfigured()))
            return { enabled: false };
        const { InstanceReportingSettingsService } = await import('./instance-reporting-settings.service.js');
        const reportTime = await di_1.Container.get(InstanceReportingSettingsService).getReportTime();
        return { enabled: true, reportTime };
    }
    async entities() {
        const { InstanceMonitoringReport } = await import('./database/entities/instance-monitoring-report.js');
        return [InstanceMonitoringReport];
    }
    async isConfigured() {
        return (await this.hasReceiver()) && (await this.hasCredential());
    }
    async hasReceiver() {
        const { InstanceReportingConfig } = await import('./instance-reporting.config.js');
        return di_1.Container.get(InstanceReportingConfig).instanceReportingBaseUrl !== '';
    }
    async hasCredential() {
        const { InstanceReportingConfig } = await import('./instance-reporting.config.js');
        if (di_1.Container.get(InstanceReportingConfig).instanceReportingAuthToken !== '')
            return true;
        const { License } = await import('../../license.js');
        return (await di_1.Container.get(License).loadCertStr()) !== '';
    }
};
exports.InstanceReportingModule = InstanceReportingModule;
exports.InstanceReportingModule = InstanceReportingModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'instance-reporting', instanceTypes: ['main'] })
], InstanceReportingModule);
//# sourceMappingURL=instance-reporting.module.js.map