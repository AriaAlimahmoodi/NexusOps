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
exports.PrometheusSystemTaskMetricsService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const prom_client_1 = __importDefault(require("prom-client"));
const system_task_metrics_event_map_1 = require("../../events/maps/system-task-metrics.event-map");
const constant_1 = require("./constant");
const database_metric_query_service_1 = require("./database-metric-query.service");
let PrometheusSystemTaskMetricsService = class PrometheusSystemTaskMetricsService {
    constructor(config, eventService, databaseQueries) {
        this.config = config;
        this.eventService = eventService;
        this.databaseQueries = databaseQueries;
    }
    get enabled() {
        return this.config.includeSystemTaskMetrics;
    }
    init() {
        const prefix = this.config.prefix;
        const runDuration = new prom_client_1.default.Histogram({
            name: `${prefix}system_task_run_duration_seconds`,
            help: 'Duration in seconds of a system task run, by task, mode (leader_timer, instance_timer, durable) and result (success, failure, aborted, lease_lost, timed_out).',
            labelNames: ['task', 'mode', 'result'],
            buckets: constant_1.DURATION_BUCKETS_SECONDS,
        });
        const runsSkipped = new prom_client_1.default.Counter({
            name: `${prefix}system_task_runs_skipped_total`,
            help: 'Total number of timer-driven system task occurrences that did not run on this instance, by task and reason (overlap, provisioned_elsewhere, aborted, coalesced).',
            labelNames: ['task', 'reason'],
        });
        const lastSuccess = new prom_client_1.default.Gauge({
            name: `${prefix}system_task_last_success_timestamp_seconds`,
            help: 'Unix timestamp in seconds of the last successful run of a system task on this instance, by task and mode.',
            labelNames: ['task', 'mode'],
        });
        const runsInFlight = new prom_client_1.default.Gauge({
            name: `${prefix}system_task_runs_in_flight`,
            help: 'Number of system task runs currently in flight on this instance, by task and mode.',
            labelNames: ['task', 'mode'],
        });
        const info = new prom_client_1.default.Gauge({
            name: `${prefix}system_task_info`,
            help: 'Always 1 for every system task this instance can run, by task and mode: leader_timer tasks on the leader, instance_timer tasks in every instance that runs them, durable tasks on every main.',
            labelNames: ['task', 'mode'],
        });
        const interval = new prom_client_1.default.Gauge({
            name: `${prefix}system_task_interval_seconds`,
            help: 'Declared cadence in seconds of a system task on an interval schedule, by task.',
            labelNames: ['task'],
        });
        const durableTasks = new Set();
        const durableJobs = this.databaseQueries.durableSystemTaskJobs(this.config.schedulerMetricsInterval * constants_1.Time.seconds.toMilliseconds);
        const collectDurableJobs = async () => {
            if (durableTasks.size > 0) {
                await this.applyDurableJobStates(durableJobs, durableTasks, scheduled, nextRun);
            }
        };
        const nextRun = new prom_client_1.default.Gauge({
            name: `${prefix}system_task_next_run_timestamp_seconds`,
            help: 'Unix timestamp in seconds of the next occurrence of a system task, by task: the occurrence a timer is armed for on this instance, or the first occurrence not yet planned for a durable task, identical on every main. Planned occurrences of a durable task can fire before this timestamp.',
            labelNames: ['task'],
            collect: collectDurableJobs,
        });
        const scheduled = new prom_client_1.default.Gauge({
            name: `${prefix}system_task_scheduled`,
            help: '1 while a system task is scheduled to run, 0 once it stopped being scheduled, by task and mode: the schedule of a leader_timer or instance_timer task could not be planned on this instance, or no runnable job is stored for a durable task.',
            labelNames: ['task', 'mode'],
            collect: collectDurableJobs,
        });
        const provisionCheckFailures = new prom_client_1.default.Counter({
            name: `${prefix}system_task_provision_check_failures_total`,
            help: 'Total number of times the check for the durable job of a system task failed, so the task ran on the leader timer anyway, by task.',
            labelNames: ['task'],
        });
        const retries = new prom_client_1.default.Counter({
            name: `${prefix}system_task_retries_total`,
            help: 'Total number of timer-driven system task retries scheduled on this instance after a failed run, by task.',
            labelNames: ['task'],
        });
        const fireLag = new prom_client_1.default.Histogram({
            name: `${prefix}system_task_fire_lag_seconds`,
            help: 'Delay in seconds between a timer-driven system task occurrence being due and its timer firing on this instance, by task.',
            labelNames: ['task'],
            buckets: constant_1.LAG_BUCKETS_SECONDS,
        });
        const leaderTimerTasks = new Set();
        const zeroedRunOutcomes = new Set();
        let timersRunning = false;
        const zeroCounts = (task, mode) => {
            const key = `${task}:${mode}`;
            if (!zeroedRunOutcomes.has(key)) {
                zeroedRunOutcomes.add(key);
                runDuration.zero({ task, mode, result: 'success' });
                runDuration.zero({ task, mode, result: 'failure' });
            }
            if (mode !== 'durable') {
                retries.inc({ task }, 0);
                system_task_metrics_event_map_1.SYSTEM_TASK_SKIP_REASONS.forEach((reason) => runsSkipped.inc({ task, reason }, 0));
            }
        };
        const seed = (task, mode) => {
            info.set({ task, mode }, 1);
            scheduled.set({ task, mode }, 1);
            runsInFlight.inc({ task, mode }, 0);
            zeroCounts(task, mode);
        };
        const leaderTimerGauges = [info, scheduled, runsInFlight, lastSuccess];
        const removeLeaderTimerSeries = (task) => {
            leaderTimerGauges.forEach((gauge) => gauge.remove({ task, mode: 'leader_timer' }));
            nextRun.remove({ task });
        };
        this.eventService.on('system-task-routed', ({ name, mode, intervalSeconds }) => {
            if (intervalSeconds !== undefined) {
                interval.set({ task: name }, intervalSeconds);
            }
            if (mode === 'leader_timer') {
                leaderTimerTasks.add(name);
            }
            if (mode === 'durable') {
                durableTasks.add(name);
            }
            if (mode !== 'leader_timer' || timersRunning) {
                seed(name, mode);
            }
        });
        this.eventService.on('system-task-timers-started', () => {
            timersRunning = true;
            leaderTimerTasks.forEach((task) => seed(task, 'leader_timer'));
        });
        this.eventService.on('system-task-timers-stopped', () => {
            timersRunning = false;
            leaderTimerTasks.forEach(removeLeaderTimerSeries);
        });
        this.eventService.on('system-task-run-started', ({ name, mode }) => {
            runsInFlight.inc({ task: name, mode });
        });
        this.eventService.on('system-task-run-settled', ({ name, mode, result, durationMs }) => {
            runsInFlight.dec({ task: name, mode });
            runDuration.observe({ task: name, mode, result }, durationMs / constants_1.Time.seconds.toMilliseconds);
            if (result === 'success') {
                lastSuccess.set({ task: name, mode }, Date.now() / constants_1.Time.seconds.toMilliseconds);
            }
        });
        this.eventService.on('system-task-run-skipped', ({ name, reason, count }) => {
            runsSkipped.inc({ task: name, reason }, count ?? 1);
        });
        this.eventService.on('system-task-scheduling-failed', ({ name, mode }) => {
            scheduled.set({ task: name, mode }, 0);
        });
        this.eventService.on('system-task-provision-check-failed', ({ name }) => {
            provisionCheckFailures.inc({ task: name });
        });
        this.eventService.on('system-task-retry-scheduled', ({ name }) => {
            retries.inc({ task: name });
        });
        this.eventService.on('system-task-next-run-planned', ({ name, nextRunAtMs }) => {
            nextRun.set({ task: name }, nextRunAtMs / constants_1.Time.seconds.toMilliseconds);
        });
        this.eventService.on('system-task-fired', ({ name, lagMs }) => {
            fireLag.observe({ task: name }, lagMs / constants_1.Time.seconds.toMilliseconds);
        });
    }
    async applyDurableJobStates(durableJobs, durableTasks, scheduled, nextRun) {
        let states;
        try {
            states = await durableJobs.get();
        }
        catch {
            return;
        }
        if (states === undefined) {
            return;
        }
        const stateByTask = new Map(states.map((state) => [state.task, state]));
        for (const task of durableTasks) {
            const state = stateByTask.get(task);
            scheduled.set({ task, mode: 'durable' }, state?.runnable ? 1 : 0);
            if (state?.runnable && state.nextRunAtSeconds !== null) {
                nextRun.set({ task }, state.nextRunAtSeconds);
            }
            else {
                nextRun.remove({ task });
            }
        }
    }
};
exports.PrometheusSystemTaskMetricsService = PrometheusSystemTaskMetricsService;
exports.PrometheusSystemTaskMetricsService = PrometheusSystemTaskMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig, backend_services_1.EventService, database_metric_query_service_1.DatabaseMetricQueryService])
], PrometheusSystemTaskMetricsService);
//# sourceMappingURL=system-task-metrics.service.js.map