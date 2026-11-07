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
exports.OtelCustomAttributesConfig = exports.OtelConfig = void 0;
const api_types_1 = require("@n8n/api-types");
const config_1 = require("@n8n/config");
const zod_1 = require("zod");
const otel_constants_1 = require("./otel.constants");
let OtelConfig = class OtelConfig {
    constructor() {
        this.enabled = false;
        this.exporterProtocol = 'http/protobuf';
        this.exporterEndpoint = 'http://localhost:4318';
        this.exporterTracingPath = '/v1/traces';
        this.exporterHeaders = '';
        this.exporterServiceName = 'n8n';
        this.tracesSampleRate = 1.0;
        this.startupConnectivityTimeoutMs = 2_000;
        this.includeNodeSpans = true;
        this.emitWorkflowStartSpan = false;
        this.emitNodeStartSpan = false;
        this.injectOutbound = true;
        this.productionExecutionsOnly = true;
    }
};
exports.OtelConfig = OtelConfig;
__decorate([
    (0, config_1.Env)(otel_constants_1.OTEL_ENV_VARS.enabled),
    __metadata("design:type", Boolean)
], OtelConfig.prototype, "enabled", void 0);
__decorate([
    (0, config_1.Env)(otel_constants_1.OTEL_ENV_VARS.exporterProtocol, api_types_1.otlpProtocolSchema),
    __metadata("design:type", String)
], OtelConfig.prototype, "exporterProtocol", void 0);
__decorate([
    (0, config_1.Env)(otel_constants_1.OTEL_ENV_VARS.exporterEndpoint, api_types_1.exporterEndpointSchema),
    __metadata("design:type", String)
], OtelConfig.prototype, "exporterEndpoint", void 0);
__decorate([
    (0, config_1.Env)(otel_constants_1.OTEL_ENV_VARS.exporterTracingPath),
    __metadata("design:type", String)
], OtelConfig.prototype, "exporterTracingPath", void 0);
__decorate([
    (0, config_1.Env)(otel_constants_1.OTEL_ENV_VARS.exporterHeaders),
    __metadata("design:type", String)
], OtelConfig.prototype, "exporterHeaders", void 0);
__decorate([
    (0, config_1.Env)(otel_constants_1.OTEL_ENV_VARS.exporterServiceName),
    __metadata("design:type", String)
], OtelConfig.prototype, "exporterServiceName", void 0);
__decorate([
    (0, config_1.Env)(otel_constants_1.OTEL_ENV_VARS.tracesSampleRate),
    __metadata("design:type", Number)
], OtelConfig.prototype, "tracesSampleRate", void 0);
__decorate([
    (0, config_1.Env)(otel_constants_1.OTEL_ENV_VARS.startupConnectivityTimeoutMs),
    __metadata("design:type", Number)
], OtelConfig.prototype, "startupConnectivityTimeoutMs", void 0);
__decorate([
    (0, config_1.Env)(otel_constants_1.OTEL_ENV_VARS.includeNodeSpans),
    __metadata("design:type", Boolean)
], OtelConfig.prototype, "includeNodeSpans", void 0);
__decorate([
    (0, config_1.Env)(otel_constants_1.OTEL_ENV_VARS.emitWorkflowStartSpan),
    __metadata("design:type", Boolean)
], OtelConfig.prototype, "emitWorkflowStartSpan", void 0);
__decorate([
    (0, config_1.Env)(otel_constants_1.OTEL_ENV_VARS.emitNodeStartSpan),
    __metadata("design:type", Boolean)
], OtelConfig.prototype, "emitNodeStartSpan", void 0);
__decorate([
    (0, config_1.Env)(otel_constants_1.OTEL_ENV_VARS.injectOutbound),
    __metadata("design:type", Boolean)
], OtelConfig.prototype, "injectOutbound", void 0);
__decorate([
    (0, config_1.Env)(otel_constants_1.OTEL_ENV_VARS.productionExecutionsOnly),
    __metadata("design:type", Boolean)
], OtelConfig.prototype, "productionExecutionsOnly", void 0);
exports.OtelConfig = OtelConfig = __decorate([
    config_1.Config
], OtelConfig);
const customAttributePrefixesSchema = zod_1.z
    .string()
    .transform((value, ctx) => {
    try {
        return JSON.parse(value);
    }
    catch {
        ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, message: 'must be valid JSON' });
        return zod_1.z.NEVER;
    }
})
    .pipe(zod_1.z
    .object({
    project: zod_1.z.string().default(otel_constants_1.DEFAULT_CUSTOM_ATTRIBUTE_PREFIXES.project),
    workflow: zod_1.z.string().default(otel_constants_1.DEFAULT_CUSTOM_ATTRIBUTE_PREFIXES.workflow),
    node: zod_1.z.string().default(otel_constants_1.DEFAULT_CUSTOM_ATTRIBUTE_PREFIXES.node),
})
    .strict());
let OtelCustomAttributesConfig = class OtelCustomAttributesConfig {
    constructor() {
        this.prefixes = { ...otel_constants_1.DEFAULT_CUSTOM_ATTRIBUTE_PREFIXES };
    }
};
exports.OtelCustomAttributesConfig = OtelCustomAttributesConfig;
__decorate([
    (0, config_1.Env)(otel_constants_1.CUSTOM_ATTRIBUTE_PREFIXES_ENV_VAR, customAttributePrefixesSchema),
    __metadata("design:type", Object)
], OtelCustomAttributesConfig.prototype, "prefixes", void 0);
exports.OtelCustomAttributesConfig = OtelCustomAttributesConfig = __decorate([
    config_1.Config
], OtelCustomAttributesConfig);
//# sourceMappingURL=otel.config.js.map