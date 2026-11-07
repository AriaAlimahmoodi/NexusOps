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
exports.InstanceReportingService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const backend_services_1 = require("@n8n/backend-services");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const constants_2 = require("../../constants");
const license_1 = require("../../license");
const backend_module_insights_1 = require("@n8n/backend-module-insights");
const config_1 = require("@n8n/backend-module-insights/config");
const instance_monitoring_report_repository_1 = require("./database/repositories/instance-monitoring-report.repository");
const instance_reporting_settings_service_1 = require("./instance-reporting-settings.service");
const instance_reporting_config_1 = require("./instance-reporting.config");
const instance_reporting_constants_1 = require("./instance-reporting.constants");
const REQUEST_TIMEOUT_MS = 30 * constants_1.Time.seconds.toMilliseconds;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5 * constants_1.Time.minutes.toMilliseconds;
const SEND_CLAIM_TIMEOUT_MS = 2 * constants_1.Time.minutes.toMilliseconds;
const SLOT_GRACE_MS = constants_1.Time.hours.toMilliseconds;
const PAYLOAD_REJECTED_STATUSES = new Set([400, 413]);
class InstanceReportRejectedError extends n8n_workflow_1.OperationalError {
    constructor(statusCode, body) {
        const reason = (0, is_record_1.isRecord)(body) && typeof body.message === 'string' ? `: ${body.message}` : '';
        super(`Instance report was rejected with status ${statusCode}${reason}`);
    }
}
const SKIP_MESSAGES = {
    'max-retries': 'Giving up on the instance report after repeated delivery failures',
    'slot-passed': 'Giving up on the instance report because its slot has passed',
    rejected: 'Giving up on the instance report because the receiver rejected its payload',
};
let InstanceReportingService = class InstanceReportingService {
    constructor(config, reportRepository, settingsService, insightsService, insightsConfig, instanceSettings, licenseMetricsRepository, license, logger, eventService, outboundHttp) {
        this.config = config;
        this.reportRepository = reportRepository;
        this.settingsService = settingsService;
        this.insightsService = insightsService;
        this.insightsConfig = insightsConfig;
        this.instanceSettings = instanceSettings;
        this.licenseMetricsRepository = licenseMetricsRepository;
        this.license = license;
        this.logger = logger;
        this.eventService = eventService;
        this.logger = this.logger.scoped('instance-reporting');
        this.http = outboundHttp.requests({
            useDefaultSsrfPolicy: 'unsafe',
            baseURL: this.config.instanceReportingBaseUrl.replace(/\/+$/, ''),
            headers: () => ({
                authorization: this.config.instanceReportingAuthToken
                    ? `Bearer ${this.config.instanceReportingAuthToken}`
                    : undefined,
            }),
            timeout: REQUEST_TIMEOUT_MS,
        });
    }
    async findDueWork(now) {
        const reportTime = await this.settingsService.getReportTime();
        let pending = await this.reportRepository.findPending();
        const retryNow = pending ? await this.reportRepository.readDbNow() : now;
        if (pending?.status === 'sending') {
            if (pending.lastAttemptAt === null ||
                retryNow.getTime() - pending.lastAttemptAt.getTime() >= SEND_CLAIM_TIMEOUT_MS) {
                await this.reportRepository.releaseStaleSend(pending.id, pending.lastAttemptAt);
                pending = await this.reportRepository.findPending();
            }
        }
        let work = { expiredReport: null, reportDue: false, slot: null };
        if (pending?.status !== 'sending') {
            const current = pending && now.getTime() < slotOn(reportTime, slotDay(pending)) + constants_1.Time.days.toMilliseconds
                ? pending
                : null;
            const slot = dueSlot(reportTime, now);
            const reportDue = current
                ? !isInRetryDelay(current, retryNow)
                : slot !== null && !(await this.reportRepository.hasSettledToday(slot));
            work = { expiredReport: current ? null : pending, reportDue, slot };
        }
        return work;
    }
    async sendDueReport(now) {
        const { expiredReport, reportDue, slot } = await this.findDueWork(now);
        if (expiredReport) {
            await this.skip(expiredReport.id, expiredReport.attempts, 'slot-passed', expiredReport.lastError);
        }
        if (reportDue) {
            await this.sendReport(slot);
        }
    }
    async sendReport(slot) {
        const licenseCert = this.config.instanceReportingAuthToken
            ? undefined
            : await this.license.loadCertStr();
        if (licenseCert === '') {
            this.logger.warn('Skipping the instance report because this instance has no license certificate.');
        }
        else {
            const report = await this.findOrCreateReport(slot);
            if (report?.status === 'pending' && report.attempts >= MAX_ATTEMPTS) {
                await this.skip(report.id, report.attempts, 'max-retries', report.lastError);
            }
            else if (report?.status === 'pending') {
                const claimedAt = await this.reportRepository.claimForSend(report.id);
                if (claimedAt) {
                    await this.deliverReport(report, claimedAt, licenseCert);
                }
            }
        }
    }
    async findOrCreateReport(slot) {
        let report = await this.reportRepository.findPending();
        if (!report && slot) {
            const days = await this.missedDays(slot);
            if (days.length > 0) {
                report = await this.reportRepository.createPending(await this.collectDataPoints(days), slot);
            }
        }
        return report;
    }
    async deliverReport(report, claimedAt, licenseCert) {
        const payload = {
            instanceId: this.instanceSettings.instanceId,
            batchId: report.id,
            ...(this.config.instanceReportingLabel ? { label: this.config.instanceReportingLabel } : {}),
            n8nVersion: constants_2.N8N_VERSION,
            dataPoints: report.dataPoints,
            ...(licenseCert ? { licenseCert } : {}),
        };
        let accepted = false;
        try {
            const response = await this.http.request({
                url: instance_reporting_constants_1.INSTANCE_REPORTS_PATH,
                method: 'POST',
                body: payload,
                json: true,
                returnFullResponse: true,
                ignoreHttpStatusErrors: true,
                disableFollowRedirect: true,
            });
            if (response.statusCode === 409) {
                this.logger.error('Instance report was rejected due to a report with the same instanceId and batchId already being recorded.', {
                    batchId: report.id,
                });
            }
            else if (PAYLOAD_REJECTED_STATUSES.has(response.statusCode)) {
                throw new InstanceReportRejectedError(response.statusCode, response.body);
            }
            else if (response.statusCode !== 201) {
                throw new n8n_workflow_1.OperationalError(`Instance report was rejected with status ${response.statusCode}`);
            }
            accepted = true;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const recorded = await this.reportRepository.recordFailure(report.id, claimedAt, message, await this.reportRepository.readDbNow());
            if (recorded) {
                this.eventService.emit('instance-report-failed');
                const attempts = report.attempts + 1;
                if (error instanceof InstanceReportRejectedError) {
                    await this.skip(report.id, attempts, 'rejected', message);
                }
                else if (attempts >= MAX_ATTEMPTS) {
                    await this.skip(report.id, attempts, 'max-retries', message);
                }
            }
            if (!(error instanceof InstanceReportRejectedError)) {
                throw error;
            }
        }
        if (accepted) {
            const recorded = await this.reportRepository.markDelivered(report.id, await this.reportRepository.readDbNow());
            if (recorded) {
                this.eventService.emit('instance-report-delivered');
                this.logger.debug('Sent instance report', { batchId: report.id });
            }
        }
    }
    async skip(id, attempts, reason, lastError) {
        if (await this.reportRepository.markSkipped(id)) {
            this.logger.error(SKIP_MESSAGES[reason], { batchId: id, attempts, lastError });
        }
    }
    async missedDays(now) {
        const yesterday = utcDayBefore(now, 1);
        const lastCoveredDay = await this.reportRepository.findLastCoveredDay();
        if (lastCoveredDay && lastCoveredDay >= yesterday)
            return [];
        const firstDay = minDay(await this.firstOwedDay(lastCoveredDay, yesterday), yesterday);
        const oldestAllowedDay = utcDayBefore(now, Math.max(1, this.insightsConfig.compactionHourlyToDailyThresholdDays - 1));
        const days = [];
        for (let day = maxDay(firstDay, oldestAllowedDay); day <= yesterday; day = addUtcDays(day, 1)) {
            days.push(day);
        }
        if (days.length > 1) {
            this.logger.info(lastCoveredDay
                ? 'Reporting days missed since the last delivered instance report'
                : 'Reporting the insights history, since no instance report was delivered yet', { firstDay: days[0], lastDay: days.at(-1), count: days.length });
        }
        return days;
    }
    async firstOwedDay(lastCoveredDay, yesterday) {
        const dayAfterCovered = lastCoveredDay ? addUtcDays(lastCoveredDay, 1) : null;
        if (dayAfterCovered === yesterday)
            return yesterday;
        const earliest = await this.insightsService.getEarliestDataDate();
        const dataStart = earliest ? earliest.toISOString().slice(0, 10) : null;
        return maxDay(dayAfterCovered ?? dataStart ?? yesterday, dataStart);
    }
    async collectDataPoints(days) {
        const firstBillableDay = await this.insightsService.getFirstBillableDay();
        const totalDays = days.filter((day) => firstBillableDay === null || day <= firstBillableDay);
        const billableDays = days.slice(totalDays.length);
        const [totalsByDay, billableByDay, { productionRootExecutions }] = await Promise.all([
            this.readDays(totalDays, async (range) => await this.insightsService.getDailyExecutionTotals(range)),
            this.readDays(billableDays, async (range) => await this.insightsService.getDailyBillableExecutions(range)),
            this.licenseMetricsRepository.getLicenseRenewalMetrics(),
        ]);
        const executionsByDay = new Map([...totalsByDay, ...billableByDay]);
        return [
            { kind: 'cumulative', name: 'billableExecutions', value: productionRootExecutions },
            ...days.map((date) => ({
                kind: 'daily',
                name: 'billableExecutions',
                value: executionsByDay.get(date) ?? 0,
                date,
            })),
        ];
    }
    async readDays(days, read) {
        if (days.length === 0) {
            return new Map();
        }
        return await read(utcDayRange(days));
    }
};
exports.InstanceReportingService = InstanceReportingService;
exports.InstanceReportingService = InstanceReportingService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [instance_reporting_config_1.InstanceReportingConfig, instance_monitoring_report_repository_1.InstanceMonitoringReportRepository, instance_reporting_settings_service_1.InstanceReportingSettingsService, backend_module_insights_1.InsightsService, config_1.InsightsConfig, n8n_core_1.InstanceSettings, db_1.LicenseMetricsRepository, license_1.License, backend_common_1.Logger, backend_services_1.EventService, backend_network_1.OutboundHttp])
], InstanceReportingService);
function slotOn(reportTime, day) {
    const [hour, minute] = reportTime.split(':').map(Number);
    return Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, minute);
}
function slotDay(report) {
    return report.reportDate ? new Date(`${report.reportDate}T00:00:00.000Z`) : report.createdAt;
}
function dueSlot(reportTime, now) {
    const today = slotOn(reportTime, now);
    const yesterday = today - constants_1.Time.days.toMilliseconds;
    if (now.getTime() >= today) {
        return new Date(today);
    }
    return now.getTime() - yesterday < SLOT_GRACE_MS ? new Date(yesterday) : null;
}
function isInRetryDelay(report, now) {
    return (report.lastAttemptAt !== null && now.getTime() - report.lastAttemptAt.getTime() < RETRY_DELAY_MS);
}
function utcDayBefore(instant, count) {
    return new Date(instant.getTime() - count * constants_1.Time.days.toMilliseconds).toISOString().slice(0, 10);
}
function addUtcDays(day, count) {
    return utcDayBefore(new Date(`${day}T00:00:00.000Z`), -count);
}
function utcDayRange(days) {
    return {
        startDate: new Date(`${days[0]}T00:00:00.000Z`),
        endDate: new Date(`${days.at(-1)}T00:00:00.000Z`),
    };
}
function maxDay(day, other) {
    return other && other > day ? other : day;
}
function minDay(day, other) {
    return other < day ? other : day;
}
//# sourceMappingURL=instance-reporting.service.js.map