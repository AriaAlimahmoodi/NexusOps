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
exports.InstanceRedactionEnforcementService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
const backend_services_1 = require("@n8n/backend-services");
const KEY = 'redaction.enforcement';
let InstanceRedactionEnforcementService = class InstanceRedactionEnforcementService {
    constructor(settingsRepository, cacheService, logger, publisher, globalConfig) {
        this.settingsRepository = settingsRepository;
        this.cacheService = cacheService;
        this.logger = logger;
        this.publisher = publisher;
        this.globalConfig = globalConfig;
    }
    async get() {
        return await this.load();
    }
    async load() {
        const raw = await this.cacheService.get(KEY, {
            refreshFn: async () => await this.loadFromDatabase(),
        });
        if (raw === undefined)
            return api_types_1.REDACTION_FLOOR_DEFAULT;
        return this.parseStoredValue(raw, 'cache') ?? api_types_1.REDACTION_FLOOR_DEFAULT;
    }
    async set(next) {
        const result = api_types_1.redactionFloorSchema.safeParse(next);
        if (!result.success) {
            this.logger.warn('Invalid redaction enforcement settings payload', {
                issues: result.error.issues,
            });
            throw new n8n_workflow_1.UserError('Invalid redaction enforcement settings');
        }
        const serialized = JSON.stringify(result.data);
        await this.settingsRepository.upsert({ key: KEY, value: serialized, loadOnStartup: true }, [
            'key',
        ]);
        await this.cacheService.set(KEY, serialized);
        if (this.globalConfig.multiMainSetup.enabled) {
            void this.publisher.publishCommand({ command: 'redaction-floor-changed' }).catch((error) => {
                this.logger.warn('[InstanceRedactionEnforcementService] Failed to publish redaction-floor-changed', {
                    error: error instanceof Error ? error.message : String(error),
                });
            });
        }
    }
    async handleRedactionFloorChanged() {
        await this.cacheService.delete(KEY);
    }
    async loadFromDatabase() {
        const row = await this.settingsRepository.findByKey(KEY);
        const value = row?.value !== undefined
            ? (this.parseStoredValue(row.value, 'database') ?? api_types_1.REDACTION_FLOOR_DEFAULT)
            : api_types_1.REDACTION_FLOOR_DEFAULT;
        return JSON.stringify(value);
    }
    parseStoredValue(raw, source) {
        let parsedJson;
        try {
            parsedJson = JSON.parse(raw);
        }
        catch (error) {
            this.logger.warn('Failed to parse redaction enforcement setting JSON', {
                source,
                cause: error instanceof Error ? error.message : String(error),
            });
            return undefined;
        }
        const result = api_types_1.redactionFloorSchema.safeParse(parsedJson);
        if (!result.success) {
            this.logger.warn('Redaction enforcement setting has an invalid shape', {
                source,
                issues: result.error.issues,
            });
            return undefined;
        }
        return result.data;
    }
};
exports.InstanceRedactionEnforcementService = InstanceRedactionEnforcementService;
__decorate([
    (0, decorators_1.OnPubSubEvent)('redaction-floor-changed', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InstanceRedactionEnforcementService.prototype, "handleRedactionFloorChanged", null);
exports.InstanceRedactionEnforcementService = InstanceRedactionEnforcementService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.SettingsRepository, backend_services_1.CacheService, backend_common_1.Logger, publisher_service_1.Publisher, config_1.GlobalConfig])
], InstanceRedactionEnforcementService);
//# sourceMappingURL=instance-redaction-enforcement.service.js.map