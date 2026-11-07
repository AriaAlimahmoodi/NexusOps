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
exports.DurableLogMetrics = void 0;
const backend_services_1 = require("@n8n/backend-services");
const di_1 = require("@n8n/di");
let DurableLogMetrics = class DurableLogMetrics {
    constructor(eventService) {
        this.eventService = eventService;
        this.drain = {
            batches: 0,
            rowsWritten: 0,
            bytesWritten: 0,
            appendConflicts: 0,
            appendFailures: 0,
            queueLatencyMsTotal: 0,
            queueLatencyMsMax: 0,
            queueLatencySamples: 0,
        };
        this.sse = {
            replaysServed: 0,
            replayEventsServed: 0,
            cursorAgeEventsTotal: 0,
            cursorAgeEventsMax: 0,
        };
        this.history = {
            foldReads: 0,
            foldLatencyMsTotal: 0,
            treesDerived: 0,
        };
        this.sweep = {
            runsExamined: 0,
            runsMarkedInterrupted: 0,
            runsCrashResumed: 0,
            toolInterruptedFacts: 0,
        };
    }
    recordDrainBatch(rows, bytes) {
        this.drain.batches++;
        this.drain.rowsWritten += rows;
        this.drain.bytesWritten += bytes;
        this.eventService.emit('instance-ai-durable-log-drained', { rows, bytes });
    }
    recordQueueLatency(ms) {
        this.drain.queueLatencyMsTotal += ms;
        this.drain.queueLatencyMsMax = Math.max(this.drain.queueLatencyMsMax, ms);
        this.drain.queueLatencySamples++;
        this.eventService.emit('instance-ai-durable-log-queue-latency', { ms });
    }
    recordAppendConflict(attempt) {
        this.drain.appendConflicts++;
        this.eventService.emit('instance-ai-durable-log-append-conflict', { attempt });
    }
    recordAppendFailure(events) {
        this.drain.appendFailures++;
        this.eventService.emit('instance-ai-durable-log-append-failure', { events });
    }
    recordReplay(eventsServed, cursorAgeEvents) {
        this.sse.replaysServed++;
        this.sse.replayEventsServed += eventsServed;
        this.sse.cursorAgeEventsTotal += cursorAgeEvents;
        this.sse.cursorAgeEventsMax = Math.max(this.sse.cursorAgeEventsMax, cursorAgeEvents);
        this.eventService.emit('instance-ai-durable-log-replayed', {
            events: eventsServed,
            cursorAgeEvents,
        });
    }
    recordFoldRead(latencyMs, trees) {
        this.history.foldReads++;
        this.history.foldLatencyMsTotal += latencyMs;
        this.history.treesDerived += trees;
        this.eventService.emit('instance-ai-history-folded', { latencyMs, trees });
    }
    recordSweepRunExamined() {
        this.sweep.runsExamined++;
    }
    recordSweepToolInterruptedFact() {
        this.sweep.toolInterruptedFacts++;
    }
    recordSweepOutcome(outcome, toolInterruptedFacts) {
        if (outcome === 'interrupted')
            this.sweep.runsMarkedInterrupted++;
        else
            this.sweep.runsCrashResumed++;
        this.eventService.emit('instance-ai-run-swept', { outcome, toolInterruptedFacts });
    }
};
exports.DurableLogMetrics = DurableLogMetrics;
exports.DurableLogMetrics = DurableLogMetrics = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.EventService])
], DurableLogMetrics);
//# sourceMappingURL=durable-log-metrics.js.map