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
exports.OtelSettingsService = exports.OTEL_SETTINGS_KEY = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const otel_config_1 = require("./otel.config");
const otel_constants_1 = require("./otel.constants");
exports.OTEL_SETTINGS_KEY = 'features.otel';
let OtelSettingsService = class OtelSettingsService {
    constructor(config, settingsRepository, logger) {
        this.config = config;
        this.settingsRepository = settingsRepository;
        this.logger = logger;
        this.currentSettings = null;
        this.envManagedFields = [];
    }
    getSettings() {
        if (!this.currentSettings)
            throw new Error('OTel settings not yet initialized');
        return {
            ...this.currentSettings,
            exporterHeaders: this.redactHeaders(this.currentSettings.exporterHeaders),
            envManagedFields: this.envManagedFields,
        };
    }
    async loadSettings() {
        const persisted = await this.getPersistedSettings();
        this.envManagedFields = Object.keys(otel_constants_1.OTEL_ENV_VARS).filter((key) => this.isEnvManaged(key));
        this.currentSettings = this.buildConfig((key) => this.isEnvManaged(key) ? this.config[key] : (persisted?.[key] ?? this.config[key]));
        return this.currentSettings;
    }
    async getPersistedSettings() {
        const row = await this.settingsRepository.findByKey(exports.OTEL_SETTINGS_KEY);
        return this.parsePersisted(row?.value);
    }
    parsePersisted(value) {
        if (!value)
            return undefined;
        try {
            const persisted = (0, n8n_workflow_1.jsonParse)(value);
            if (!(0, is_record_1.isRecord)(persisted)) {
                this.logger.warn('Persisted OTel settings are not a settings object; using defaults instead');
                return undefined;
            }
            const settings = persisted;
            if ('exporterHeaders' in settings && typeof settings.exporterHeaders !== 'string') {
                this.logger.warn('Persisted OTel settings contain a non-string exporterHeaders value; using the default instead');
                delete settings.exporterHeaders;
            }
            return settings;
        }
        catch (error) {
            this.logger.warn('Persisted OTel settings contain invalid JSON; using defaults instead', {
                error: error instanceof Error ? error.message : String(error),
            });
            return undefined;
        }
    }
    async saveSettings(incoming) {
        const existing = await this.settingsRepository.findByKey(exports.OTEL_SETTINGS_KEY);
        const persisted = this.parsePersisted(existing?.value);
        const sanitized = this.buildConfig((key) => this.isEnvManaged(key) ? this.config[key] : incoming[key]);
        if (!this.isEnvManaged('exporterHeaders')) {
            sanitized.exporterHeaders = this.resolveHeaders(incoming.exporterHeaders, persisted?.exporterHeaders ?? '');
        }
        const value = JSON.stringify(sanitized);
        if (existing) {
            existing.value = value;
            await this.settingsRepository.save(existing, { transaction: false });
        }
        else {
            await this.settingsRepository.save({ key: exports.OTEL_SETTINGS_KEY, value, loadOnStartup: true }, { transaction: false });
        }
    }
    resolveTestConnection(incoming) {
        const pick = (key) => this.isEnvManaged(key) ? this.config[key] : incoming[key];
        return {
            exporterProtocol: pick('exporterProtocol'),
            exporterEndpoint: pick('exporterEndpoint'),
            exporterTracingPath: pick('exporterTracingPath'),
            exporterServiceName: pick('exporterServiceName'),
            exporterHeaders: this.isEnvManaged('exporterHeaders')
                ? this.config.exporterHeaders
                : this.resolveHeaders(incoming.exporterHeaders, this.currentSettings?.exporterHeaders ?? ''),
            startupConnectivityTimeoutMs: pick('startupConnectivityTimeoutMs'),
        };
    }
    redactHeaders(headers) {
        return this.serializeHeaderPairs(this.parseHeaderPairs(headers).map(({ key, value }) => ({
            key,
            value: value ? n8n_workflow_1.CREDENTIAL_BLANKING_VALUE : '',
        })));
    }
    resolveHeaders(incoming, stored) {
        const storedByKey = new Map(this.parseHeaderPairs(stored).map((p) => [p.key, p.value]));
        return this.serializeHeaderPairs(this.parseHeaderPairs(incoming).flatMap(({ key, value }) => {
            if (value !== n8n_workflow_1.CREDENTIAL_BLANKING_VALUE)
                return [{ key, value }];
            const storedValue = storedByKey.get(key);
            return storedValue === undefined ? [] : [{ key, value: storedValue }];
        }));
    }
    parseHeaderPairs(headers) {
        if (!headers.trim())
            return [];
        return headers
            .split(',')
            .map((pair) => {
            const idx = pair.indexOf('=');
            return idx === -1
                ? { key: pair.trim(), value: '' }
                : { key: pair.slice(0, idx).trim(), value: pair.slice(idx + 1).trim() };
        })
            .filter((p) => p.key);
    }
    serializeHeaderPairs(pairs) {
        return pairs
            .filter((p) => p.key.trim())
            .map((p) => `${p.key}=${p.value}`)
            .join(',');
    }
    isEnvManaged(key) {
        const envVar = otel_constants_1.OTEL_ENV_VARS[key];
        return process.env[envVar] !== undefined || !!process.env[`${envVar}_FILE`];
    }
    buildConfig(pick) {
        return {
            enabled: pick('enabled'),
            exporterProtocol: pick('exporterProtocol'),
            exporterEndpoint: pick('exporterEndpoint'),
            exporterTracingPath: pick('exporterTracingPath'),
            exporterServiceName: pick('exporterServiceName'),
            exporterHeaders: pick('exporterHeaders'),
            tracesSampleRate: pick('tracesSampleRate'),
            startupConnectivityTimeoutMs: pick('startupConnectivityTimeoutMs'),
            includeNodeSpans: pick('includeNodeSpans'),
            emitWorkflowStartSpan: pick('emitWorkflowStartSpan'),
            emitNodeStartSpan: pick('emitNodeStartSpan'),
            injectOutbound: pick('injectOutbound'),
            productionExecutionsOnly: pick('productionExecutionsOnly'),
        };
    }
};
exports.OtelSettingsService = OtelSettingsService;
exports.OtelSettingsService = OtelSettingsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [otel_config_1.OtelConfig, db_1.SettingsRepository, backend_common_1.Logger])
], OtelSettingsService);
//# sourceMappingURL=otel-settings.service.js.map