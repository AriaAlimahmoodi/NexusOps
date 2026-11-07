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
exports.DatabaseMetricQueryService = void 0;
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const cached_metric_query_1 = require("./cached-metric-query");
let DatabaseMetricQueryService = class DatabaseMetricQueryService {
    constructor(cachedQueries, workflowRepository, licenseMetricsRepository, outboxRepository, taskRepository, jobRepository) {
        this.cachedQueries = cachedQueries;
        this.workflowRepository = workflowRepository;
        this.licenseMetricsRepository = licenseMetricsRepository;
        this.outboxRepository = outboxRepository;
        this.taskRepository = taskRepository;
        this.jobRepository = jobRepository;
    }
    activeWorkflowCount(ttlMs) {
        return this.cachedQueries.create({
            cacheKey: 'metrics:active-workflow-count:v2',
            ttlMs,
            query: async () => await this.workflowRepository.getActiveCount(),
        });
    }
    workflowInfo(ttlMs, activeOnly) {
        return this.cachedQueries.create({
            cacheKey: activeOnly ? 'metrics:active-workflow-info:v1' : 'metrics:workflow-info:v2',
            ttlMs,
            query: async () => await this.workflowRepository.getWorkflowInfo({ activeOnly }),
        });
    }
    workflowStatistics(ttlMs) {
        return this.cachedQueries.create({
            cacheKey: 'metrics:workflow-statistics:shared:v2',
            ttlMs,
            query: async () => await this.licenseMetricsRepository.getLicenseRenewalMetrics(),
        });
    }
    workflowPublication(ttlMs) {
        return this.cachedQueries.create({
            cacheKey: 'metrics:workflow-publication:outbox-record-stats:v2',
            ttlMs,
            query: async () => {
                const stats = await this.outboxRepository.getRecordStatsByStatus();
                const byStatus = {};
                for (const [status, { count, oldestCreatedAt }] of stats) {
                    byStatus[status] = { count, oldestMs: oldestCreatedAt.getTime() };
                }
                return byStatus;
            },
        });
    }
    schedulerSnapshot(ttlMs) {
        return this.cachedQueries.create({
            cacheKey: 'metrics:scheduler:snapshot:v1',
            ttlMs,
            query: async () => await this.taskRepository.getMetricSnapshot(),
        });
    }
    durableSystemTaskJobs(ttlMs) {
        return this.cachedQueries.create({
            cacheKey: 'metrics:system-tasks:durable-jobs:v1',
            ttlMs,
            query: async () => {
                const jobs = await this.jobRepository.findScheduleStatesByOwnerType(constants_1.ScheduledJobOwnerType.SystemTask);
                return jobs.map(({ ownerId, runnable, nextRunAt }) => ({
                    task: ownerId,
                    runnable,
                    nextRunAtSeconds: nextRunAt === null ? null : nextRunAt.getTime() / constants_1.Time.seconds.toMilliseconds,
                }));
            },
        });
    }
};
exports.DatabaseMetricQueryService = DatabaseMetricQueryService;
exports.DatabaseMetricQueryService = DatabaseMetricQueryService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [cached_metric_query_1.CachedMetricQueryFactory, db_1.WorkflowRepository, db_1.LicenseMetricsRepository, db_1.WorkflowPublicationOutboxRepository, db_1.ScheduledTaskRepository, db_1.ScheduledJobRepository])
], DatabaseMetricQueryService);
//# sourceMappingURL=database-metric-query.service.js.map