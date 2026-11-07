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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrometheusSchedulerMetricsService = void 0;
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const prom_client_1 = __importDefault(require("prom-client"));
const cached_metric_query_1 = require("./cached-metric-query");
const constant_1 = require("./constant");
const database_metric_query_service_1 = require("./database-metric-query.service");
let PrometheusSchedulerMetricsService = class PrometheusSchedulerMetricsService {
    constructor(config, instanceSettings, databaseQueries) {
        this.config = config;
        this.instanceSettings = instanceSettings;
        this.databaseQueries = databaseQueries;
        this.initialized = false;
    }
    get enabled() {
        return this.config.includeSchedulerMetrics && this.instanceSettings.instanceType === 'main';
    }
    init() {
        this.initPushMetrics();
        this.initSnapshotGauges();
        this.initialized = true;
    }
    initPushMetrics() {
        const prefix = this.config.prefix;
        this.tasksDispatched = new prom_client_1.default.Counter({
            name: `${prefix}scheduler_tasks_dispatched_total`,
            help: 'Total number of scheduler tasks dispatched to a handler by task type.',
            labelNames: ['task_type'],
        });
        this.tasksCompleted = new prom_client_1.default.Counter({
            name: `${prefix}scheduler_tasks_completed_total`,
            help: 'Total number of scheduler tasks that finished firing by task type and result.',
            labelNames: ['task_type', 'result'],
        });
        this.taskRetries = new prom_client_1.default.Counter({
            name: `${prefix}scheduler_task_retries_total`,
            help: 'Total number of scheduler task retries by task type.',
            labelNames: ['task_type'],
        });
        this.occurrencesMaterialized = new prom_client_1.default.Counter({
            name: `${prefix}scheduler_occurrences_materialized_total`,
            help: 'Total number of occurrences materialized from job schedules.',
        });
        this.jobsDeferred = new prom_client_1.default.Counter({
            name: `${prefix}scheduler_jobs_deferred_total`,
            help: 'Total number of jobs deferred for retry during materialization.',
        });
        this.occurrencesMisfired = new prom_client_1.default.Counter({
            name: `${prefix}scheduler_occurrences_misfired_total`,
            help: "Total number of due occurrences a schedule's misfire policy discarded rather than record, by task type and policy.",
            labelNames: ['task_type', 'policy'],
        });
        this.occurrencesRetired = new prom_client_1.default.Counter({
            name: `${prefix}scheduler_occurrences_retired_total`,
            help: 'Total number of already-recorded occurrences retired because a catch-up run superseded them.',
        });
        this.occurrencesMissed = new prom_client_1.default.Counter({
            name: `${prefix}scheduler_occurrences_missed_total`,
            help: 'Total number of pending occurrences the reaper marked missed after they went past their deadline unclaimed.',
        });
        this.tasksReclaimed = new prom_client_1.default.Counter({
            name: `${prefix}scheduler_tasks_reclaimed_total`,
            help: 'Total number of expired scheduler tasks reclaimed by the reaper.',
        });
        this.tasksDeadLettered = new prom_client_1.default.Counter({
            name: `${prefix}scheduler_tasks_dead_lettered_total`,
            help: 'Total number of scheduler tasks dead-lettered after exhausting their attempts, from either path: a terminal handler failure or the reaper recovering an expired lease.',
        });
        this.tasksPruned = new prom_client_1.default.Counter({
            name: `${prefix}scheduler_tasks_pruned_total`,
            help: 'Total number of finished scheduler tasks deleted by retention.',
        });
        this.jobsQuarantined = new prom_client_1.default.Counter({
            name: `${prefix}scheduler_jobs_quarantined_total`,
            help: 'Total number of scheduled jobs disabled by owner reconciliation because their owner was reported gone.',
        });
        this.orphanedJobsDeleted = new prom_client_1.default.Counter({
            name: `${prefix}scheduler_orphaned_jobs_deleted_total`,
            help: 'Total number of quarantined scheduled jobs deleted by owner reconciliation after their owner stayed gone past the quarantine grace.',
        });
        this.jobsRevived = new prom_client_1.default.Counter({
            name: `${prefix}scheduler_jobs_revived_total`,
            help: 'Total number of quarantined scheduled jobs re-enabled by owner reconciliation because their owner turned out to still exist.',
        });
        this.tasksLeaseLost = new prom_client_1.default.Counter({
            name: `${prefix}scheduler_tasks_lease_lost_total`,
            help: 'Total number of scheduler tasks whose handler finished after the lease was reclaimed, so another instance may have run the same occurrence concurrently, by task type.',
            labelNames: ['task_type'],
        });
        this.leaseRenewals = new prom_client_1.default.Counter({
            name: `${prefix}scheduler_lease_renewals_total`,
            help: 'Total number of lease renewals of running scheduler tasks by task type and result: renewed, lost when a renewal found the claim gone, or expired when no renewal succeeded for a whole lease.',
            labelNames: ['task_type', 'result'],
        });
        this.taskTimeouts = new prom_client_1.default.Counter({
            name: `${prefix}scheduler_task_timeouts_total`,
            help: 'Total number of scheduler task runs stopped because they reached their timeout, by task type.',
            labelNames: ['task_type'],
        });
        this.dispatchLagSeconds = new prom_client_1.default.Histogram({
            name: `${prefix}scheduler_dispatch_lag_seconds`,
            help: 'Delay in seconds between a task becoming due and being dispatched, by task type.',
            labelNames: ['task_type'],
            buckets: constant_1.DURATION_BUCKETS_SECONDS,
        });
        this.occurrencesMaterialized.inc(0);
        this.jobsDeferred.inc(0);
        this.occurrencesRetired.inc(0);
        this.occurrencesMissed.inc(0);
        this.tasksReclaimed.inc(0);
        this.tasksDeadLettered.inc(0);
        this.tasksPruned.inc(0);
        this.jobsQuarantined.inc(0);
        this.orphanedJobsDeleted.inc(0);
        this.jobsRevived.inc(0);
    }
    initSnapshotGauges() {
        const prefix = this.config.prefix;
        const ttlMs = this.config.schedulerMetricsInterval * constants_1.Time.seconds.toMilliseconds;
        const query = this.databaseQueries.schedulerSnapshot(ttlMs);
        new prom_client_1.default.Gauge({
            name: `${prefix}scheduler_tasks_pending`,
            help: 'Number of pending scheduler tasks awaiting dispatch. Cluster-wide snapshot, identical on every main; aggregate with max/avg, not sum.',
            async collect() {
                this.set((0, cached_metric_query_1.toGaugeValue)(await query.get(), (snapshot) => snapshot.pending));
            },
        });
        new prom_client_1.default.Gauge({
            name: `${prefix}scheduler_tasks_due`,
            help: 'Number of pending scheduler tasks already due for dispatch. Cluster-wide snapshot, identical on every main; aggregate with max/avg, not sum.',
            async collect() {
                this.set((0, cached_metric_query_1.toGaugeValue)(await query.get(), (snapshot) => snapshot.due));
            },
        });
        new prom_client_1.default.Gauge({
            name: `${prefix}scheduler_tasks_running`,
            help: 'Number of scheduler tasks currently claimed and in flight. Cluster-wide snapshot, identical on every main; aggregate with max/avg, not sum.',
            async collect() {
                this.set((0, cached_metric_query_1.toGaugeValue)(await query.get(), (snapshot) => snapshot.running));
            },
        });
        new prom_client_1.default.Gauge({
            name: `${prefix}scheduler_oldest_pending_age_seconds`,
            help: 'Age in seconds of the oldest due pending scheduler task; 0 means no due backlog (not a task 0s late). Cluster-wide snapshot, identical on every main; aggregate with max/avg, not sum.',
            async collect() {
                this.set((0, cached_metric_query_1.toGaugeValue)(await query.get(), (snapshot) => snapshot.oldestPendingAgeMs !== null
                    ? snapshot.oldestPendingAgeMs * constants_1.Time.milliseconds.toSeconds
                    : 0));
            },
        });
    }
    recordDispatch(taskType) {
        if (this.initialized) {
            this.tasksDispatched.inc({ task_type: taskType }, 1);
        }
    }
    recordFireOutcome(taskType, result) {
        if (this.initialized) {
            this.tasksCompleted.inc({ task_type: taskType, result }, 1);
        }
    }
    recordRetry(taskType) {
        if (this.initialized) {
            this.taskRetries.inc({ task_type: taskType }, 1);
        }
    }
    observeDispatchLagSeconds(taskType, seconds) {
        if (this.initialized) {
            this.dispatchLagSeconds.observe({ task_type: taskType }, seconds);
        }
    }
    recordLeaseLost(taskType) {
        if (this.initialized) {
            this.tasksLeaseLost.inc({ task_type: taskType }, 1);
        }
    }
    recordLeaseRenewal(taskType, result) {
        if (this.initialized) {
            this.leaseRenewals.inc({ task_type: taskType, result }, 1);
        }
    }
    recordTaskTimeout(taskType) {
        if (this.initialized) {
            this.taskTimeouts.inc({ task_type: taskType }, 1);
        }
    }
    recordMaterialized(occurrences, deferredJobs) {
        if (this.initialized) {
            this.occurrencesMaterialized.inc(occurrences);
            this.jobsDeferred.inc(deferredJobs);
        }
    }
    recordMisfired(discarded) {
        if (this.initialized) {
            for (const group of discarded) {
                this.occurrencesMisfired.inc({ task_type: group.taskType, policy: group.policy }, group.discarded);
            }
        }
    }
    recordRetired(retired) {
        if (this.initialized) {
            this.occurrencesRetired.inc(retired);
        }
    }
    recordReaped(reclaimed, deadLettered, missed) {
        if (this.initialized) {
            this.tasksReclaimed.inc(reclaimed);
            this.tasksDeadLettered.inc(deadLettered);
            this.occurrencesMissed.inc(missed);
        }
    }
    recordDeadLettered() {
        if (this.initialized) {
            this.tasksDeadLettered.inc(1);
        }
    }
    recordPruned(deleted) {
        if (this.initialized) {
            this.tasksPruned.inc(deleted);
        }
    }
    recordReconciled(quarantined, deleted, revived) {
        if (this.initialized) {
            this.jobsQuarantined.inc(quarantined);
            this.orphanedJobsDeleted.inc(deleted);
            this.jobsRevived.inc(revived);
        }
    }
};
exports.PrometheusSchedulerMetricsService = PrometheusSchedulerMetricsService;
exports.PrometheusSchedulerMetricsService = PrometheusSchedulerMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig, n8n_core_1.InstanceSettings, database_metric_query_service_1.DatabaseMetricQueryService])
], PrometheusSchedulerMetricsService);
//# sourceMappingURL=scheduler-metrics.service.js.map