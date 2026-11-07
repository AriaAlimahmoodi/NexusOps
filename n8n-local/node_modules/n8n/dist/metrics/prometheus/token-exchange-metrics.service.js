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
exports.PrometheusTokenExchangeMetricsService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const prom_client_1 = __importDefault(require("prom-client"));
let PrometheusTokenExchangeMetricsService = class PrometheusTokenExchangeMetricsService {
    constructor(config, eventService) {
        this.config = config;
        this.eventService = eventService;
    }
    get enabled() {
        return true;
    }
    init() {
        const tokenExchangeRequestsTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}token_exchange_requests_total`,
            help: 'Total number of token exchange requests.',
            labelNames: ['result'],
        });
        tokenExchangeRequestsTotal.inc({ result: 'success' }, 0);
        tokenExchangeRequestsTotal.inc({ result: 'failure' }, 0);
        const tokenExchangeFailuresTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}token_exchange_failures_total`,
            help: 'Total number of token exchange failures broken down by reason.',
            labelNames: ['reason'],
        });
        const embedLoginRequestsTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}embed_login_requests_total`,
            help: 'Total number of embed login requests.',
            labelNames: ['result'],
        });
        embedLoginRequestsTotal.inc({ result: 'success' }, 0);
        embedLoginRequestsTotal.inc({ result: 'failure' }, 0);
        const embedLoginFailuresTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}embed_login_failures_total`,
            help: 'Total number of embed login failures broken down by reason.',
            labelNames: ['reason'],
        });
        const tokenExchangeJitProvisioningTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}token_exchange_jit_provisioning_total`,
            help: 'Total number of users JIT-provisioned via token exchange.',
        });
        tokenExchangeJitProvisioningTotal.inc(0);
        const tokenExchangeIdentityLinkedTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}token_exchange_identity_linked_total`,
            help: 'Total number of external identities linked to existing users via token exchange.',
        });
        tokenExchangeIdentityLinkedTotal.inc(0);
        this.eventService.on('token-exchange-succeeded', () => {
            tokenExchangeRequestsTotal.inc({ result: 'success' }, 1);
        });
        this.eventService.on('token-exchange-failed', ({ failureReason }) => {
            tokenExchangeRequestsTotal.inc({ result: 'failure' }, 1);
            tokenExchangeFailuresTotal.inc({ reason: failureReason }, 1);
        });
        this.eventService.on('embed-login', () => {
            embedLoginRequestsTotal.inc({ result: 'success' }, 1);
        });
        this.eventService.on('embed-login-failed', ({ failureReason }) => {
            embedLoginRequestsTotal.inc({ result: 'failure' }, 1);
            embedLoginFailuresTotal.inc({ reason: failureReason }, 1);
        });
        this.eventService.on('token-exchange-user-provisioned', () => {
            tokenExchangeJitProvisioningTotal.inc(1);
        });
        this.eventService.on('token-exchange-identity-linked', () => {
            tokenExchangeIdentityLinkedTotal.inc(1);
        });
    }
};
exports.PrometheusTokenExchangeMetricsService = PrometheusTokenExchangeMetricsService;
exports.PrometheusTokenExchangeMetricsService = PrometheusTokenExchangeMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig, backend_services_1.EventService])
], PrometheusTokenExchangeMetricsService);
//# sourceMappingURL=token-exchange-metrics.service.js.map