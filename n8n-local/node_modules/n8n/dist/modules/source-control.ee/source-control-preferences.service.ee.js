"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceControlPreferencesService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const class_validator_1 = require("class-validator");
const promises_1 = require("fs/promises");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const promises_2 = require("node:fs/promises");
const path = __importStar(require("path"));
const backend_services_1 = require("@n8n/backend-services");
const constants_1 = require("./constants");
const source_control_helper_ee_1 = require("./source-control-helper.ee");
const source_control_config_1 = require("./source-control.config");
const source_control_preferences_1 = require("./types/source-control-preferences");
let SourceControlPreferencesService = class SourceControlPreferencesService {
    constructor(instanceSettings, logger, cipher, settingsRepository, sourceControlConfig, instanceWriteAccess) {
        this.instanceSettings = instanceSettings;
        this.logger = logger;
        this.cipher = cipher;
        this.settingsRepository = settingsRepository;
        this.sourceControlConfig = sourceControlConfig;
        this.instanceWriteAccess = instanceWriteAccess;
        this._sourceControlPreferences = new source_control_preferences_1.SourceControlPreferences();
        this.sshFolder = path.join(instanceSettings.n8nFolder, constants_1.SOURCE_CONTROL_SSH_FOLDER);
        this.gitFolder = path.join(instanceSettings.n8nFolder, constants_1.SOURCE_CONTROL_GIT_FOLDER);
        this.sshKeyName = path.join(this.sshFolder, constants_1.SOURCE_CONTROL_SSH_KEY_NAME);
    }
    get sourceControlPreferences() {
        return {
            ...this._sourceControlPreferences,
            connected: this._sourceControlPreferences.connected ?? false,
        };
    }
    set sourceControlPreferences(preferences) {
        this._sourceControlPreferences = source_control_preferences_1.SourceControlPreferences.merge(preferences, this._sourceControlPreferences);
        this.instanceWriteAccess.setReadOnly(this._sourceControlPreferences.branchReadOnly ?? false);
    }
    isSourceControlSetup() {
        return (this.isSourceControlLicensedAndEnabled() &&
            this.getPreferences().repositoryUrl &&
            this.getPreferences().branchName);
    }
    async getKeyPairFromDatabase() {
        const dbSetting = await this.settingsRepository.findByKey('features.sourceControl.sshKeys');
        if (!dbSetting?.value)
            return null;
        return (0, n8n_workflow_1.jsonParse)(dbSetting.value, { fallbackValue: null });
    }
    async getPrivateKeyFromDatabase() {
        const dbKeyPair = await this.getKeyPairFromDatabase();
        if (!dbKeyPair)
            throw new n8n_workflow_1.UnexpectedError('Failed to find key pair in database');
        return await this.cipher.decryptV2(dbKeyPair.encryptedPrivateKey);
    }
    async getPublicKeyFromDatabase() {
        const dbKeyPair = await this.getKeyPairFromDatabase();
        if (!dbKeyPair)
            throw new n8n_workflow_1.UnexpectedError('Failed to find key pair in database');
        return dbKeyPair.publicKey;
    }
    async getHttpsCredentialsFromDatabase() {
        const dbSetting = await this.settingsRepository.findByKey('features.sourceControl.httpsCredentials');
        if (!dbSetting?.value)
            throw new n8n_workflow_1.UnexpectedError('No credentials found for https connection');
        return (0, n8n_workflow_1.jsonParse)(dbSetting.value);
    }
    async getDecryptedHttpsCredentials() {
        const credentials = await this.getHttpsCredentialsFromDatabase();
        return {
            username: await this.cipher.decryptV2(credentials.encryptedUsername),
            password: await this.cipher.decryptV2(credentials.encryptedPassword),
        };
    }
    async saveHttpsCredentials(username, password) {
        try {
            await this.settingsRepository.save({
                key: 'features.sourceControl.httpsCredentials',
                value: JSON.stringify({
                    encryptedUsername: await this.cipher.encryptV2(username),
                    encryptedPassword: await this.cipher.encryptV2(password),
                }),
                loadOnStartup: true,
            });
        }
        catch (error) {
            throw new n8n_workflow_1.UnexpectedError('Failed to save HTTPS credentials to database', { cause: error });
        }
    }
    async deleteHttpsCredentials() {
        try {
            await this.settingsRepository.delete({ key: 'features.sourceControl.httpsCredentials' });
        }
        catch (error) {
            this.logger.error('Failed to delete HTTPS credentials from database', { error });
        }
    }
    async getPrivateKeyPath() {
        const dbPrivateKey = await this.getPrivateKeyFromDatabase();
        const tempFilePath = path.join(this.instanceSettings.n8nFolder, 'ssh_private_key_temp');
        const normalizedKey = dbPrivateKey.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        try {
            await (0, promises_1.rm)(tempFilePath, { force: true });
            await (0, promises_2.writeFile)(tempFilePath, normalizedKey, { mode: 0o600 });
        }
        catch (error) {
            this.logger.error('Failed to write SSH private key to temp file', {
                tempFilePath,
                error: error instanceof Error ? error.message : String(error),
            });
            throw new n8n_workflow_1.UnexpectedError('Failed to create SSH private key file', { cause: error });
        }
        return tempFilePath;
    }
    async getPublicKey() {
        try {
            const dbPublicKey = await this.getPublicKeyFromDatabase();
            if (dbPublicKey)
                return dbPublicKey;
            return await (0, promises_2.readFile)(this.sshKeyName + '.pub', { encoding: 'utf8' });
        }
        catch (e) {
            const error = e instanceof Error ? e : new Error(`${e}`);
            this.logger.error(`Failed to read SSH public key: ${error.message}`);
        }
        return '';
    }
    async deleteKeyPair() {
        try {
            await (0, promises_1.rm)(this.sshFolder, { recursive: true });
            await this.settingsRepository.delete({ key: 'features.sourceControl.sshKeys' });
        }
        catch (e) {
            const error = e instanceof Error ? e : new Error(`${e}`);
            this.logger.error(`Failed to delete SSH key pair: ${error.message}`);
        }
    }
    async resetKnownHosts() {
        const knownHostsPath = path.join(this.sshFolder, 'known_hosts');
        try {
            await (0, promises_1.rm)(knownHostsPath, { force: true });
            this.logger.debug('Cleared SSH known_hosts file');
        }
        catch (error) {
            this.logger.warn('Failed to clear known_hosts file', { error });
        }
    }
    async generateAndSaveKeyPair(keyPairType) {
        if (!keyPairType) {
            keyPairType =
                this.getPreferences().keyGeneratorType ?? this.sourceControlConfig.defaultKeyPairType;
        }
        const keyPair = await (0, source_control_helper_ee_1.generateSshKeyPair)(keyPairType);
        try {
            await this.settingsRepository.save({
                key: 'features.sourceControl.sshKeys',
                value: JSON.stringify({
                    encryptedPrivateKey: await this.cipher.encryptV2(keyPair.privateKey),
                    publicKey: keyPair.publicKey,
                }),
                loadOnStartup: true,
            });
        }
        catch (error) {
            throw new n8n_workflow_1.UnexpectedError('Failed to write key pair to database', { cause: error });
        }
        if (keyPairType !== this.getPreferences().keyGeneratorType) {
            await this.setPreferences({ keyGeneratorType: keyPairType });
        }
        return this.getPreferences();
    }
    isBranchReadOnly() {
        return this._sourceControlPreferences.branchReadOnly;
    }
    isSourceControlConnected() {
        return this.sourceControlPreferences.connected;
    }
    isSourceControlLicensedAndEnabled() {
        return this.isSourceControlConnected() && (0, source_control_helper_ee_1.isSourceControlLicensed)();
    }
    getBranchName() {
        return this.sourceControlPreferences.branchName;
    }
    getPreferences() {
        return this.sourceControlPreferences;
    }
    async validateSourceControlPreferences(preferences, allowMissingProperties = true) {
        const preferencesObject = new source_control_preferences_1.SourceControlPreferences(preferences);
        const validationResult = await (0, class_validator_1.validate)(preferencesObject, {
            forbidUnknownValues: false,
            skipMissingProperties: allowMissingProperties,
            stopAtFirstError: false,
            validationError: { target: false },
        });
        if (validationResult.length > 0) {
            throw new n8n_workflow_1.UnexpectedError('Invalid source control preferences', {
                extra: { preferences: validationResult },
            });
        }
        return validationResult;
    }
    async setPreferences(preferences, saveToDb = true, broadcastReload = true) {
        const noKeyPair = (await this.getKeyPairFromDatabase()) === null;
        if (noKeyPair &&
            (preferences.connectionType === 'ssh' || preferences.connectionType === undefined)) {
            await this.generateAndSaveKeyPair();
        }
        const sanitizedPreferences = { ...preferences };
        if (preferences.httpsUsername && preferences.httpsPassword) {
            await this.saveHttpsCredentials(preferences.httpsUsername, preferences.httpsPassword);
        }
        delete sanitizedPreferences.httpsUsername;
        delete sanitizedPreferences.httpsPassword;
        this.sourceControlPreferences = sanitizedPreferences;
        if (saveToDb) {
            const settingsValue = JSON.stringify(this._sourceControlPreferences);
            try {
                await this.settingsRepository.save({
                    key: constants_1.SOURCE_CONTROL_PREFERENCES_DB_KEY,
                    value: settingsValue,
                    loadOnStartup: true,
                }, { transaction: false });
            }
            catch (error) {
                throw new n8n_workflow_1.UnexpectedError('Failed to save source control preferences', { cause: error });
            }
            if (broadcastReload) {
                await this.broadcastReloadSourceControlConfiguration();
            }
        }
        return this.sourceControlPreferences;
    }
    async broadcastReloadSourceControlConfiguration() {
        if (this.instanceSettings.isMultiMain) {
            const { Publisher } = await import('../../scaling/pubsub/publisher.service.js');
            await di_1.Container.get(Publisher).publishCommand({ command: 'reload-source-control-config' });
            this.logger.debug('Broadcasting source control configuration reload to other main instances');
        }
    }
    async loadFromDbAndApplySourceControlPreferences() {
        const loadedPreferences = await this.settingsRepository.findOne({
            where: { key: constants_1.SOURCE_CONTROL_PREFERENCES_DB_KEY },
        });
        if (loadedPreferences) {
            try {
                const preferences = (0, n8n_workflow_1.jsonParse)(loadedPreferences.value);
                if (preferences) {
                    await this.setPreferences(preferences, false, false);
                    return preferences;
                }
            }
            catch (error) {
                this.logger.warn(`Could not parse Source Control settings from database: ${error.message}`);
            }
        }
        await this.setPreferences(new source_control_preferences_1.SourceControlPreferences(), true, false);
        return this.sourceControlPreferences;
    }
};
exports.SourceControlPreferencesService = SourceControlPreferencesService;
exports.SourceControlPreferencesService = SourceControlPreferencesService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.InstanceSettings, backend_common_1.Logger, n8n_core_1.Cipher, db_1.SettingsRepository, source_control_config_1.SourceControlConfig, backend_services_1.InstanceWriteAccessService])
], SourceControlPreferencesService);
//# sourceMappingURL=source-control-preferences.service.ee.js.map