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
exports.RuntimeCredentialsService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const path_traversal_1 = require("./path-traversal");
const runtime_credentials_config_1 = require("./runtime-credentials.config");
const runtime_credentials_schemas_1 = require("./runtime-credentials.schemas");
let RuntimeCredentialsService = class RuntimeCredentialsService {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
        this.sensitiveFieldRules = {};
    }
    init() {
        const parsedSetting = (0, n8n_workflow_1.jsonParse)(this.config.sensitiveFieldRules, {
            errorMessage: "Failed to json parse configuration rules 'N8N_SECURITY_SENSITIVE_FIELD_RULES'",
        });
        const parsedRules = runtime_credentials_schemas_1.sensitiveFieldRulesSchema.safeParse(parsedSetting);
        if (!parsedRules.success) {
            this.logger.error("Failed to validate configuration rules 'N8N_SECURITY_SENSITIVE_FIELD_RULES'", {
                error: parsedRules.error,
            });
            throw new Error("Failed to validate configuration rules 'N8N_SECURITY_SENSITIVE_FIELD_RULES'");
        }
        this.sensitiveFieldRules = parsedRules.data;
    }
    extractFromItem(rule, item) {
        const extracted = (0, path_traversal_1.extractAndClear)(item.json, rule.path);
        if (extracted === undefined)
            return undefined;
        return toJsonValue(extracted);
    }
    strip(items, triggerNodeType) {
        const artifactsByAlias = {};
        for (const [alias, rule] of Object.entries(this.sensitiveFieldRules)) {
            if (rule.nodeType !== '*' && rule.nodeType !== triggerNodeType) {
                continue;
            }
            const values = items
                .map((item) => this.extractFromItem(rule, item))
                .filter((value) => value !== undefined);
            if (values.length === 0)
                continue;
            artifactsByAlias[alias] = values;
        }
        return { triggerItems: items, artifactsByAlias };
    }
};
exports.RuntimeCredentialsService = RuntimeCredentialsService;
exports.RuntimeCredentialsService = RuntimeCredentialsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, runtime_credentials_config_1.RuntimeCredentialsConfig])
], RuntimeCredentialsService);
function toJsonValue(value) {
    if (value === undefined)
        return undefined;
    try {
        const serialised = JSON.stringify(value);
        if (serialised === undefined)
            return undefined;
        return JSON.parse(serialised);
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=runtime-credentials.service.js.map