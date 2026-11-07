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
exports.CredentialsOverwrites = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const credential_types_1 = require("./credential-types");
const static_auth_service_1 = require("./services/static-auth-service");
const CREDENTIALS_OVERWRITE_KEY = 'credentialsOverwrite';
let CredentialsOverwrites = class CredentialsOverwrites {
    constructor(globalConfig, credentialTypes, logger, settings, cipher) {
        this.globalConfig = globalConfig;
        this.credentialTypes = credentialTypes;
        this.logger = logger;
        this.settings = settings;
        this.cipher = cipher;
        this.overwriteData = {};
        this.resolvedTypes = [];
        this.reloading = false;
    }
    registerReloadHandler(handler) {
        this.reloadHandler = handler;
    }
    async init() {
        const data = this.globalConfig.credentials.overwrite.data;
        if (data) {
            this.logger.debug('Loading overwrite credentials from static envvar');
            const overwriteData = (0, n8n_workflow_1.jsonParse)(data, {
                errorMessage: 'The credentials-overwrite is not valid JSON.',
            });
            this.setPlainData(overwriteData);
        }
        const persistence = this.globalConfig.credentials.overwrite.persistence;
        if (persistence) {
            this.logger.debug('Loading overwrite credentials from database');
            await this.loadOverwriteDataFromDB(false);
        }
    }
    async reloadOverwriteCredentials() {
        await this.loadOverwriteDataFromDB(true);
    }
    async loadOverwriteDataFromDB(reloadFrontend) {
        if (this.reloading)
            return;
        try {
            this.reloading = true;
            this.logger.debug('Loading overwrite credentials from DB');
            const data = await this.settings.findByKey(CREDENTIALS_OVERWRITE_KEY);
            if (data) {
                const decryptedData = await this.cipher.decryptV2(data.value);
                const overwriteData = (0, n8n_workflow_1.jsonParse)(decryptedData, {
                    errorMessage: 'The credentials-overwrite is not valid JSON.',
                });
                await this.setData(overwriteData, false, reloadFrontend);
            }
        }
        catch (error) {
            this.logger.error('Error loading overwrite credentials', { error });
        }
        finally {
            this.reloading = false;
        }
    }
    async broadcastReloadOverwriteCredentialsCommand() {
        const { Publisher } = await import('./scaling/pubsub/publisher.service.js');
        await di_1.Container.get(Publisher).publishCommand({ command: 'reload-overwrite-credentials' });
    }
    async saveOverwriteDataToDB(overwriteData, broadcast = true) {
        const data = await this.cipher.encryptV2(JSON.stringify(overwriteData));
        const setting = this.settings.create({
            key: CREDENTIALS_OVERWRITE_KEY,
            value: data,
            loadOnStartup: false,
        });
        await this.settings.save(setting);
        if (broadcast) {
            await this.broadcastReloadOverwriteCredentialsCommand();
        }
    }
    getOverwriteEndpointMiddleware() {
        const { endpointAuthToken } = this.globalConfig.credentials.overwrite;
        return static_auth_service_1.StaticAuthService.getStaticAuthMiddleware(endpointAuthToken);
    }
    setPlainData(overwriteData) {
        this.resolvedTypes.length = 0;
        this.overwriteData = overwriteData;
        for (const type in overwriteData) {
            const overwrites = this.getOverwrites(type);
            if (overwrites && Object.keys(overwrites).length) {
                this.overwriteData[type] = overwrites;
            }
        }
    }
    async setData(overwriteData, storeInDb = true, reloadFrontend = true) {
        this.setPlainData(overwriteData);
        if (storeInDb && this.globalConfig.credentials.overwrite.persistence) {
            await this.saveOverwriteDataToDB(overwriteData, true);
        }
        if (reloadFrontend) {
            await this.reloadHandler?.();
        }
    }
    applyOverwrite(type, data) {
        const overwrites = this.get(type);
        if (overwrites === undefined) {
            return data;
        }
        if (this.globalConfig.credentials.overwrite?.skipTypes?.includes(type)) {
            const isFieldCustomized = (key) => {
                const storedValue = data[key];
                return (storedValue !== null &&
                    storedValue !== undefined &&
                    storedValue !== '' &&
                    storedValue !== overwrites[key]);
            };
            if (Object.keys(overwrites).some(isFieldCustomized)) {
                return data;
            }
        }
        const returnData = (0, n8n_workflow_1.deepCopy)(data);
        for (const key of Object.keys(overwrites)) {
            if (overwrites[key] === '')
                continue;
            const current = returnData[key];
            if (current === null || current === undefined || current === '') {
                returnData[key] = overwrites[key];
            }
        }
        return returnData;
    }
    getOverwrites(type) {
        if (this.resolvedTypes.includes(type)) {
            return this.overwriteData[type];
        }
        if (!this.credentialTypes.recognizes(type)) {
            this.logger.warn(`Unknown credential type ${type} in Credential overwrites`);
            return;
        }
        const credentialTypeData = this.credentialTypes.getByName(type);
        if (credentialTypeData.extends === undefined) {
            this.resolvedTypes.push(type);
            return this.overwriteData[type];
        }
        const overwrites = {};
        for (const credentialsTypeName of credentialTypeData.extends) {
            Object.assign(overwrites, this.getOverwrites(credentialsTypeName));
        }
        if (this.overwriteData[type] !== undefined) {
            Object.assign(overwrites, this.overwriteData[type]);
        }
        this.resolvedTypes.push(type);
        return overwrites;
    }
    get(name) {
        const parentTypes = this.credentialTypes.getParentTypes(name);
        const entries = [name, ...parentTypes]
            .reverse()
            .map((type) => this.overwriteData[type])
            .filter((type) => !!type);
        if (entries.length === 0)
            return undefined;
        return entries.reduce((acc, current) => Object.assign(acc, current), {});
    }
    getAll() {
        return this.overwriteData;
    }
    supportsManagedAuth(type) {
        return this.get(type) !== undefined;
    }
    isManagedOAuthType(type) {
        if (!this.credentialTypes.recognizes(type))
            return false;
        const parentTypes = this.credentialTypes.getParentTypes(type);
        const extendsBase = (base) => type === base || parentTypes.includes(base);
        const clientFields = extendsBase('oAuth2Api')
            ? ['clientId', 'clientSecret']
            : extendsBase('oAuth1Api')
                ? ['consumerKey', 'consumerSecret']
                : undefined;
        if (!clientFields)
            return false;
        if (this.globalConfig.credentials.overwrite?.skipTypes?.includes(type))
            return false;
        const overwrites = this.get(type);
        return !!overwrites && clientFields.every((field) => field in overwrites);
    }
    usesManagedAuth(type, data) {
        const overwrites = this.get(type);
        if (overwrites === undefined)
            return false;
        const applied = this.applyOverwrite(type, data);
        return Object.keys(overwrites).some((key) => applied[key] !== data[key]);
    }
};
exports.CredentialsOverwrites = CredentialsOverwrites;
__decorate([
    (0, decorators_1.OnPubSubEvent)('reload-overwrite-credentials'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CredentialsOverwrites.prototype, "reloadOverwriteCredentials", null);
exports.CredentialsOverwrites = CredentialsOverwrites = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, credential_types_1.CredentialTypes, backend_common_1.Logger, db_1.SettingsRepository, n8n_core_1.Cipher])
], CredentialsOverwrites);
//# sourceMappingURL=credentials-overwrites.js.map