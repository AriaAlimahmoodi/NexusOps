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
exports.PrometheusEventBusMetricsService = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const prom_client_1 = __importDefault(require("prom-client"));
const message_event_bus_1 = require("../../eventbus/message-event-bus/message-event-bus");
let PrometheusEventBusMetricsService = class PrometheusEventBusMetricsService {
    constructor(eventBus, config) {
        this.eventBus = eventBus;
        this.config = config;
        this.countersByEventName = new Map();
    }
    get enabled() {
        return this.config.includeMessageEventBusMetrics;
    }
    init() {
        this.eventBus.on('metrics.eventBus.event', (event) => {
            const counter = this.toCounter(event);
            if (counter) {
                const labels = this.toLabels(event);
                counter.inc(labels, 1);
            }
        });
    }
    toCounter(event) {
        const { eventName } = event;
        if (!this.countersByEventName.has(eventName)) {
            const metricName = this.toMetricName(eventName);
            if (metricName) {
                const labels = this.toLabels(event);
                const counter = new prom_client_1.default.Counter({
                    name: metricName,
                    help: `Total number of ${eventName} events.`,
                    labelNames: Object.keys(labels),
                });
                this.countersByEventName.set(eventName, counter);
            }
        }
        return this.countersByEventName.get(eventName);
    }
    toMetricName(eventName) {
        const metricName = `${this.config.prefix}${eventName.replace('n8n.', '').replace(/\./g, '_')}_total`;
        if (prom_client_1.default.validateMetricName(metricName)) {
            return metricName;
        }
        return null;
    }
    toLabels(event) {
        const { __type, eventName, payload } = event;
        switch (__type) {
            case "$$EventMessageAudit":
                if (eventName.startsWith('n8n.audit.user.credentials')) {
                    return this.config.includeCredentialTypeLabel
                        ? {
                            credential_type: String((event.payload.credentialType ?? 'unknown').replace(/\./g, '_')),
                        }
                        : {};
                }
                if (eventName.startsWith('n8n.audit.workflow')) {
                    return this.buildWorkflowLabels(payload);
                }
                break;
            case "$$EventMessageNode": {
                const nodeLabels = this.buildWorkflowLabels(payload);
                if (this.config.includeNodeTypeLabel) {
                    nodeLabels.node_type = String((payload.nodeType ?? 'unknown').replace('n8n-nodes-', '').replace(/\./g, '_'));
                }
                return nodeLabels;
            }
            case "$$EventMessageWorkflow":
                return this.buildWorkflowLabels(payload);
        }
        return {};
    }
    buildWorkflowLabels(payload) {
        const labels = {};
        if (this.config.includeWorkflowIdLabel) {
            labels.workflow_id = typeof payload.workflowId === 'string' ? payload.workflowId : 'unknown';
        }
        if (this.config.includeWorkflowNameLabel) {
            labels.workflow_name =
                typeof payload.workflowName === 'string' ? payload.workflowName : 'unknown';
        }
        return labels;
    }
};
exports.PrometheusEventBusMetricsService = PrometheusEventBusMetricsService;
exports.PrometheusEventBusMetricsService = PrometheusEventBusMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [message_event_bus_1.MessageEventBus, config_1.PrometheusMetricsConfig])
], PrometheusEventBusMetricsService);
//# sourceMappingURL=event-bus-metrics.service.js.map