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
exports.AiUsageService = void 0;
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const config_2 = __importDefault(require("../config"));
const backend_services_1 = require("@n8n/backend-services");
const KEY = 'ai.allowSendingParameterValues';
let AiUsageService = class AiUsageService {
    constructor(settingsRepository, cacheService, globalConfig) {
        this.settingsRepository = settingsRepository;
        this.cacheService = cacheService;
        this.globalConfig = globalConfig;
    }
    async isParameterValueSharingAllowed() {
        if (!this.globalConfig.ai.allowSendingParameterValues)
            return false;
        return await this.getAiUsageSettings();
    }
    async getAiUsageSettings() {
        const allowSendingParameterValues = await this.cacheService.get(KEY);
        if (allowSendingParameterValues !== undefined) {
            return allowSendingParameterValues === 'true';
        }
        const row = await this.settingsRepository.findByKey(KEY);
        const allowSending = (row?.value ?? 'true') === 'true';
        await this.cacheService.set(KEY, allowSending.toString());
        return allowSending;
    }
    async updateAiUsageSettings(allowSendingActualData) {
        await this.settingsRepository.upsert({ key: KEY, value: allowSendingActualData.toString(), loadOnStartup: true }, ['key']);
        await this.cacheService.set(KEY, allowSendingActualData.toString());
        config_2.default.set(KEY, allowSendingActualData);
    }
};
exports.AiUsageService = AiUsageService;
exports.AiUsageService = AiUsageService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.SettingsRepository, backend_services_1.CacheService, config_1.GlobalConfig])
], AiUsageService);
//# sourceMappingURL=ai-usage.service.js.map