"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemorySystemTaskRunner = void 0;
const constants_1 = require("@n8n/constants");
const scheduler_1 = require("@n8n/scheduler");
const emit_system_task_metric_1 = require("./emit-system-task-metric");
const system_task_run_observer_1 = require("./system-task-run-observer");
const system_task_timer_1 = require("./system-task-timer");
class InMemorySystemTaskRunner {
    constructor(mode, logger, eventService, tracing, timezone, hooks) {
        this.mode = mode;
        this.logger = logger;
        this.eventService = eventService;
        this.tracing = tracing;
        this.timezone = timezone;
        this.hooks = hooks;
        this.entries = [];
        this.started = false;
        this.generation = 0;
        this.controller = new AbortController();
    }
    add(task, schedule, options = {}) {
        const entry = {
            ...options,
            task,
            timer: this.createTimer(task, schedule, () => {
                void this.run(entry);
            }),
        };
        this.entries.push(entry);
        (0, emit_system_task_metric_1.emitSystemTaskMetric)(this.eventService, 'system-task-routed', {
            name: task.name,
            mode: this.mode,
            intervalSeconds: schedule.kind === 'interval' ? schedule.intervalSeconds : undefined,
        });
        if (this.started) {
            this.startTimer(entry, new Date());
        }
    }
    start(from) {
        if (!this.started) {
            this.started = true;
            this.generation++;
            this.controller = new AbortController();
            this.hooks.onStart?.();
            for (const entry of this.entries) {
                this.startTimer(entry, from);
            }
            this.logger.debug('Started the in-memory system task timers', {
                mode: this.mode,
                count: this.entries.length,
            });
        }
    }
    async stop() {
        const generation = ++this.generation;
        this.started = false;
        this.controller.abort();
        for (const entry of this.entries) {
            this.stopTimer(entry);
        }
        this.logger.debug('Stopped the in-memory system task timers', { mode: this.mode });
        await Promise.all(this.entries.flatMap(({ inFlightRun }) => (inFlightRun ? [inFlightRun.promise] : [])));
        if (generation === this.generation) {
            this.hooks.onStop?.();
        }
    }
    startTimer(entry, from) {
        entry.timer.start(from);
        if (entry.runOnStart) {
            void this.run(entry);
        }
    }
    stopTimer(entry) {
        entry.timer.stop();
        this.cancelRetry(entry);
    }
    createTimer(task, schedule, onFire) {
        return new system_task_timer_1.SystemTaskTimer((0, scheduler_1.scheduleFromDefinition)(schedule, this.timezone), (lagMs, coalesced) => {
            (0, emit_system_task_metric_1.emitSystemTaskMetric)(this.eventService, 'system-task-fired', { name: task.name, lagMs });
            if (coalesced > 0) {
                this.emitSkipped(task, 'coalesced', coalesced);
            }
            onFire();
        }, (error) => {
            this.hooks.reportFailure('Could not plan a system task schedule, so the task will not run', task, error);
            (0, emit_system_task_metric_1.emitSystemTaskMetric)(this.eventService, 'system-task-scheduling-failed', {
                name: task.name,
                mode: this.mode,
            });
        }, (fireAt) => {
            (0, emit_system_task_metric_1.emitSystemTaskMetric)(this.eventService, 'system-task-next-run-planned', {
                name: task.name,
                nextRunAtMs: fireAt.getTime(),
            });
        });
    }
    async run(entry) {
        if (entry.inFlightRun) {
            if (!entry.inFlightRun.skipWarned) {
                entry.inFlightRun.skipWarned = true;
                this.logger.warn('Skipped a system task occurrence, its previous run is still going', {
                    name: entry.task.name,
                });
            }
            this.emitSkipped(entry.task, 'overlap');
        }
        else {
            this.cancelRetry(entry);
            const inFlightRun = {
                promise: this.runOnce(entry).finally(() => {
                    if (entry.inFlightRun === inFlightRun) {
                        entry.inFlightRun = undefined;
                    }
                }),
                skipWarned: false,
            };
            entry.inFlightRun = inFlightRun;
            await inFlightRun.promise;
        }
    }
    async runOnce(entry) {
        const { signal } = this.controller;
        const skipped = entry.shouldSkipRun !== undefined && (await entry.shouldSkipRun());
        if (!skipped) {
            if (signal.aborted) {
                this.emitSkipped(entry.task, 'aborted');
            }
            else {
                const outcome = await (0, system_task_run_observer_1.observeSystemTaskRun)(this.eventService, this.tracing, entry.task, this.mode, signal);
                if (outcome.result === 'failure') {
                    this.hooks.reportFailure('A system task run failed', entry.task, outcome.error);
                    this.scheduleRetry(entry);
                }
            }
        }
    }
    scheduleRetry(entry) {
        const { retryDelaySeconds } = entry;
        if (retryDelaySeconds !== undefined && this.started) {
            this.cancelRetry(entry);
            entry.retryTimer = setTimeout(() => {
                void this.run(entry);
            }, retryDelaySeconds * constants_1.Time.seconds.toMilliseconds);
            entry.retryTimer.unref();
            (0, emit_system_task_metric_1.emitSystemTaskMetric)(this.eventService, 'system-task-retry-scheduled', {
                name: entry.task.name,
            });
        }
    }
    cancelRetry(entry) {
        clearTimeout(entry.retryTimer);
        entry.retryTimer = undefined;
    }
    emitSkipped(task, reason, count) {
        (0, emit_system_task_metric_1.emitSystemTaskMetric)(this.eventService, 'system-task-run-skipped', {
            name: task.name,
            reason,
            ...(count === undefined ? {} : { count }),
        });
    }
}
exports.InMemorySystemTaskRunner = InMemorySystemTaskRunner;
//# sourceMappingURL=in-memory-system-task-runner.js.map