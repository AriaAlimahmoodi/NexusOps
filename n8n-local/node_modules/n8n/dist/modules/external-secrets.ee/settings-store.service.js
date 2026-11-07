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
exports.ExternalSecretsSettingsStore = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("./constants");
let ExternalSecretsSettingsStore = class ExternalSecretsSettingsStore {
    constructor(settingsRepo, cipher) {
        this.settingsRepo = settingsRepo;
        this.cipher = cipher;
        this.cache = null;
    }
    async load() {
        if (this.cache !== null) {
            return this.cache;
        }
        return await this.reload();
    }
    async reload() {
        const encryptedSettings = (await this.settingsRepo.findByKey(constants_1.EXTERNAL_SECRETS_DB_KEY))?.value ?? null;
        if (encryptedSettings === null) {
            this.cache = {};
            return {};
        }
        this.cache = await this.decrypt(encryptedSettings);
        return this.cache;
    }
    getCached() {
        return this.cache ?? {};
    }
    async save(settings) {
        const encryptedSettings = await this.encrypt(settings);
        await this.settingsRepo.upsert({
            key: constants_1.EXTERNAL_SECRETS_DB_KEY,
            value: encryptedSettings,
            loadOnStartup: false,
        }, ['key']);
        this.cache = settings;
    }
    async updateProvider(providerName, partialSettings) {
        const loadedSettings = await this.reload();
        const settings = { ...loadedSettings };
        const isNewProvider = !(providerName in settings);
        const defaultValues = {
            connected: false,
            connectedAt: null,
            settings: {},
        };
        settings[providerName] = {
            ...(settings[providerName] ?? defaultValues),
            ...partialSettings,
        };
        await this.save(settings);
        return { settings, isNewProvider };
    }
    async getProvider(providerName) {
        const settings = await this.load();
        return settings[providerName];
    }
    async removeProvider(providerName) {
        const loadedSettings = await this.load();
        const settings = { ...loadedSettings };
        delete settings[providerName];
        await this.save(settings);
    }
    async decrypt(encryptedData) {
        const decryptedData = await this.cipher.decryptV2(encryptedData);
        try {
            return (0, n8n_workflow_1.jsonParse)(decryptedData);
        }
        catch (e) {
            throw new n8n_workflow_1.UnexpectedError('External Secrets Settings could not be decrypted. The likely reason is that a different "encryptionKey" was used to encrypt the data.');
        }
    }
    async encrypt(settings) {
        return await this.cipher.encryptV2(settings);
    }
};
exports.ExternalSecretsSettingsStore = ExternalSecretsSettingsStore;
exports.ExternalSecretsSettingsStore = ExternalSecretsSettingsStore = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.SettingsRepository, n8n_core_1.Cipher])
], ExternalSecretsSettingsStore);
//# sourceMappingURL=settings-store.service.js.map