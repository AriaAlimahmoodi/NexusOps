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
exports.InstanceReportingSettingsService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const node_crypto_1 = require("node:crypto");
const n8n_workflow_1 = require("n8n-workflow");
const config_1 = require("@n8n/backend-module-insights/config");
const instance_reporting_constants_1 = require("./instance-reporting.constants");
const REPORT_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MINUTES_PER_DAY = 24 * 60;
const EARLIEST_REPORT_MINUTES = 3 * 60;
let InstanceReportingSettingsService = class InstanceReportingSettingsService {
    constructor(settingsRepository, insightsConfig, logger) {
        this.settingsRepository = settingsRepository;
        this.insightsConfig = insightsConfig;
        this.logger = logger;
        this.logger = this.logger.scoped('instance-reporting');
    }
    async getReportTime() {
        const stored = await this.readReportTime();
        if (stored)
            return await this.clearCompactionWindow(stored);
        const candidate = { reportTime: this.randomReportTime() };
        await this.settingsRepository.claimKey(instance_reporting_constants_1.CENTRAL_INSTANCE_MONITORING_SETTINGS_KEY, JSON.stringify(candidate));
        const claimed = await this.readReportTime();
        if (claimed) {
            this.logger.debug('Resolved the instance reporting time', { reportTime: claimed });
            return await this.clearCompactionWindow(claimed);
        }
        this.logger.warn('Instance reporting time setting is missing or malformed; writing a fresh one', { key: instance_reporting_constants_1.CENTRAL_INSTANCE_MONITORING_SETTINGS_KEY });
        await this.persistReportTime(candidate.reportTime);
        return candidate.reportTime;
    }
    async clearCompactionWindow(reportTime) {
        const floor = this.compactionFloorMinutes();
        const minutes = toMinutes(reportTime);
        if (minutes >= floor)
            return reportTime;
        const offset = Math.max(0, minutes - EARLIEST_REPORT_MINUTES) % (MINUTES_PER_DAY - floor);
        const shifted = toReportTime(floor + offset);
        await this.persistReportTime(shifted);
        this.logger.warn('Moved the instance reporting time later so it clears the insights compaction window', {
            previousReportTime: reportTime,
            reportTime: shifted,
            compactionIntervalMinutes: this.insightsConfig.compactionIntervalMinutes,
        });
        return shifted;
    }
    compactionFloorMinutes() {
        const requiredMinutes = Math.ceil(2 * this.insightsConfig.compactionIntervalMinutes);
        return Math.min(Math.max(EARLIEST_REPORT_MINUTES, requiredMinutes), MINUTES_PER_DAY - 1);
    }
    randomReportTime() {
        return toReportTime((0, node_crypto_1.randomInt)(this.compactionFloorMinutes(), MINUTES_PER_DAY));
    }
    async persistReportTime(reportTime) {
        await this.settingsRepository.upsertByKey(instance_reporting_constants_1.CENTRAL_INSTANCE_MONITORING_SETTINGS_KEY, JSON.stringify({ reportTime }), false, {});
    }
    async readReportTime() {
        const setting = await this.settingsRepository.findByKey(instance_reporting_constants_1.CENTRAL_INSTANCE_MONITORING_SETTINGS_KEY);
        if (!setting?.value)
            return undefined;
        const parsed = (0, n8n_workflow_1.jsonParse)(setting.value, {
            fallbackValue: {},
        });
        const { reportTime } = parsed;
        return typeof reportTime === 'string' && REPORT_TIME_PATTERN.test(reportTime)
            ? reportTime
            : undefined;
    }
};
exports.InstanceReportingSettingsService = InstanceReportingSettingsService;
exports.InstanceReportingSettingsService = InstanceReportingSettingsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.SettingsRepository, config_1.InsightsConfig, backend_common_1.Logger])
], InstanceReportingSettingsService);
function toMinutes(reportTime) {
    const [hour, minute] = reportTime.split(':');
    return Number(hour) * 60 + Number(minute);
}
function toReportTime(minutes) {
    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}
function pad(value) {
    return String(value).padStart(2, '0');
}
//# sourceMappingURL=instance-reporting-settings.service.js.map