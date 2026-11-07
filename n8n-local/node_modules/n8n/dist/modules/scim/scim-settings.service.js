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
exports.ScimSettingsService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const backend_services_1 = require("@n8n/backend-services");
const ENABLED_KEY = 'scim.provisioning.enabled';
let ScimSettingsService = class ScimSettingsService {
    constructor(settingsRepository, cacheService) {
        this.settingsRepository = settingsRepository;
        this.cacheService = cacheService;
    }
    async isEnabled() {
        const cached = await this.cacheService.get(ENABLED_KEY);
        if (cached !== undefined)
            return cached === 'true';
        const row = await this.settingsRepository.findByKey(ENABLED_KEY);
        const enabled = row?.value === 'true';
        await this.cacheService.set(ENABLED_KEY, enabled.toString());
        return enabled;
    }
    async setEnabled(enabled) {
        await this.settingsRepository.upsert({ key: ENABLED_KEY, value: enabled.toString(), loadOnStartup: true }, ['key']);
        await this.cacheService.set(ENABLED_KEY, enabled.toString());
    }
};
exports.ScimSettingsService = ScimSettingsService;
exports.ScimSettingsService = ScimSettingsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.SettingsRepository, backend_services_1.CacheService])
], ScimSettingsService);
//# sourceMappingURL=scim-settings.service.js.map