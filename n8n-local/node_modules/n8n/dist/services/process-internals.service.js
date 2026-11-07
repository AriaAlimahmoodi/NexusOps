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
exports.ProcessInternalsService = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const active_executions_1 = require("../active-executions");
const push_1 = require("../push");
const scaling_service_1 = require("../scaling/scaling.service");
const wait_tracker_1 = require("../wait-tracker");
let ProcessInternalsService = class ProcessInternalsService {
    constructor(instanceSettings, globalConfig) {
        this.instanceSettings = instanceSettings;
        this.globalConfig = globalConfig;
    }
    collect() {
        const { instanceType, hostId, isLeader } = this.instanceSettings;
        const collections = {};
        const add = (owner, counts) => {
            for (const [name, value] of Object.entries(counts))
                collections[`${owner}.${name}`] = value;
        };
        if (this.globalConfig.executions.mode === 'queue') {
            add('scaling', di_1.Container.get(scaling_service_1.ScalingService).getDiagnosticCounts());
        }
        if (instanceType === 'main' || instanceType === 'webhook') {
            add('activeExecutions', di_1.Container.get(active_executions_1.ActiveExecutions).getDiagnosticCounts());
        }
        if (instanceType === 'main') {
            add('triggers', di_1.Container.get(n8n_core_1.ActiveWorkflowTriggers).getDiagnosticCounts());
            add('scheduledTasks', di_1.Container.get(n8n_core_1.ScheduledTaskManager).getDiagnosticCounts());
            add('waitTracker', di_1.Container.get(wait_tracker_1.WaitTracker).getDiagnosticCounts());
            add('push', di_1.Container.get(push_1.Push).getBackend().getDiagnosticCounts());
        }
        const resources = {};
        for (const type of process.getActiveResourcesInfo()) {
            resources[type] = (resources[type] ?? 0) + 1;
        }
        const { rss, heapTotal, heapUsed, external, arrayBuffers } = process.memoryUsage();
        return {
            version: 1,
            instanceType,
            hostId,
            isLeader,
            memory: { rss, heapTotal, heapUsed, external, arrayBuffers },
            resources,
            collections,
        };
    }
};
exports.ProcessInternalsService = ProcessInternalsService;
exports.ProcessInternalsService = ProcessInternalsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.InstanceSettings, config_1.GlobalConfig])
], ProcessInternalsService);
//# sourceMappingURL=process-internals.service.js.map