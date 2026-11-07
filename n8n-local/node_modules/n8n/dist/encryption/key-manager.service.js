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
exports.KeyManagerService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const node_crypto_1 = require("node:crypto");
const errors_1 = require("@n8n/errors");
const key_rotation_flag_1 = require("./key-rotation-flag");
const RAW_DEK_PATTERN = /^[0-9a-f]{64}$/i;
const CBC_WRAPPED_PREFIX = 'U2FsdGVk';
const ACTIVE_KEY_MEMO_TTL_MS = 5 * 1000;
const KEY_BY_ID_CACHE_CAPACITY = 10;
let KeyManagerService = class KeyManagerService {
    constructor(deploymentKeyRepository, cipher, instanceSettings, logger) {
        this.deploymentKeyRepository = deploymentKeyRepository;
        this.cipher = cipher;
        this.instanceSettings = instanceSettings;
        this.logger = logger;
        this.keyInfoById = new Map();
    }
    async getActiveKey() {
        if (!(0, key_rotation_flag_1.isKeyRotationEnabled)()) {
            return this.instanceKeyLegacyInfo();
        }
        if (this.activeKeyMemo && this.activeKeyMemo.expiresAt > Date.now()) {
            return this.activeKeyMemo.info;
        }
        const activeKeys = await this.deploymentKeyRepository.findActiveDataEncryptionKeys();
        if (activeKeys.length === 0) {
            throw new errors_1.NotFoundError('No active encryption key found');
        }
        if (activeKeys.length > 1) {
            throw new Error('Encryption key invariant violated: multiple active keys found');
        }
        const key = activeKeys[0];
        const keyInfo = {
            id: key.id,
            value: key.value,
            algorithm: key.algorithm,
            format: 'prefixed',
        };
        this.rememberKeyInfo(keyInfo);
        this.activeKeyMemo = { info: keyInfo, expiresAt: Date.now() + ACTIVE_KEY_MEMO_TTL_MS };
        return keyInfo;
    }
    async getKeyById(id) {
        const cached = this.keyInfoById.get(id);
        if (cached) {
            this.keyInfoById.delete(id);
            this.keyInfoById.set(id, cached);
            return cached;
        }
        const key = await this.deploymentKeyRepository.findDataEncryptionKeyById(id);
        if (!key)
            return null;
        const keyInfo = {
            id: key.id,
            value: key.value,
            algorithm: key.algorithm,
            format: 'prefixed',
        };
        this.rememberKeyInfo(keyInfo);
        return keyInfo;
    }
    recoverLegacyDek(keyInfo) {
        const { value } = keyInfo;
        if (value === this.instanceSettings.encryptionKey) {
            return value;
        }
        if (RAW_DEK_PATTERN.test(value)) {
            return value;
        }
        if (value.startsWith(CBC_WRAPPED_PREFIX)) {
            let recovered;
            try {
                recovered = this.cipher.decryptWithInstanceKey(value);
            }
            catch {
                this.logger.warn(`Failed to decrypt legacy CBC-wrapped DEK ${keyInfo.id} with the instance key, this was probably wrapped with a different instance key`);
                return null;
            }
            if (!RAW_DEK_PATTERN.test(recovered)) {
                this.logger.warn(`Recovered legacy DEK ${keyInfo.id} is not valid raw key material`);
                return null;
            }
            return recovered;
        }
        try {
            this.cipher.decryptDEKWithInstanceKey(value);
        }
        catch (error) {
            this.logger.warn(`DEK ${keyInfo.id} is in an unrecognized format. n8n cannot re-wrap it with this instance key, so reads of data without a key-id prefix will fail.`, { error });
        }
        return null;
    }
    async repairLegacyDataEncryptionKeys() {
        const rows = await this.deploymentKeyRepository.findDataEncryptionKeys();
        for (const row of rows) {
            const rawKey = this.recoverLegacyDek(row);
            if (rawKey === null)
                continue;
            const wrapped = this.cipher.encryptDEKWithInstanceKey(rawKey);
            await this.deploymentKeyRepository.rewrapLegacyDataEncryptionValue(row.id, row.value, wrapped);
            this.logger.info(`Re-wrapped legacy DEK ${row.id} with the instance key`);
        }
    }
    async getLegacyKey() {
        if (this.cachedStoredLegacyKey)
            return this.cachedStoredLegacyKey;
        try {
            const key = await this.deploymentKeyRepository.findDataEncryptionKeyByAlgorithm('aes-256-cbc');
            if (key) {
                this.cachedStoredLegacyKey = {
                    id: key.id,
                    value: key.value,
                    algorithm: key.algorithm,
                    format: 'no-prefix',
                };
                return this.cachedStoredLegacyKey;
            }
            if (!this.cachedInstanceKeyInfo) {
                this.logger.warn('Legacy aes-256-cbc encryption key not found; falling back to instance key');
            }
        }
        catch (error) {
            this.logger.warn('Key store unavailable while reading legacy key; using the instance key directly', { error });
        }
        return this.instanceKeyLegacyInfo();
    }
    async bootstrapLegacyCbcKey(instanceEncryptionKey) {
        const existing = await this.deploymentKeyRepository.findDataEncryptionKeyByAlgorithm('aes-256-cbc');
        if (existing)
            return;
        const encryptedValue = this.cipher.encryptDEKWithInstanceKey(instanceEncryptionKey);
        await this.deploymentKeyRepository.seedLegacyCbcKey(encryptedValue);
    }
    instanceKeyLegacyInfo() {
        this.cachedInstanceKeyInfo ??= {
            id: 'instance-key',
            value: this.cipher.encryptDEKWithInstanceKey(this.instanceSettings.encryptionKey),
            algorithm: 'aes-256-cbc',
            format: 'no-prefix',
        };
        return this.cachedInstanceKeyInfo;
    }
    async bootstrapGcmKey() {
        const existing = await this.deploymentKeyRepository.findActiveDataEncryptionKeyByAlgorithm('aes-256-gcm');
        if (existing)
            return;
        const rawKey = (0, node_crypto_1.randomBytes)(32).toString('hex');
        const encryptedValue = this.cipher.encryptDEKWithInstanceKey(rawKey);
        await this.deploymentKeyRepository.seedActiveDataEncryptionKey(encryptedValue, 'aes-256-gcm');
    }
    async listKeys(query) {
        const [field, direction] = (query.sortBy ?? 'createdAt:desc').split(':');
        return await this.deploymentKeyRepository.findAndCountForList({
            type: query.type,
            sortField: field,
            sortDirection: direction.toUpperCase(),
            skip: query.skip,
            take: query.take,
            createdAtFrom: query.activatedFrom ? new Date(query.activatedFrom) : undefined,
            createdAtTo: query.activatedTo ? new Date(query.activatedTo) : undefined,
        });
    }
    async rotateKey() {
        const rawKey = (0, node_crypto_1.randomBytes)(32).toString('hex');
        return await this.addKey(rawKey, 'aes-256-gcm', true);
    }
    async addKey(plaintextValue, algorithm, setAsActive = false) {
        const encryptedValue = this.cipher.encryptDEKWithInstanceKey(plaintextValue);
        if (!setAsActive) {
            return await this.deploymentKeyRepository.insertInactiveDataEncryptionKey(encryptedValue, algorithm);
        }
        const saved = await this.deploymentKeyRepository.insertAndActivateDataEncryptionKey(encryptedValue, algorithm);
        const savedInfo = {
            id: saved.id,
            value: saved.value,
            algorithm: saved.algorithm,
            format: 'prefixed',
        };
        this.rememberKeyInfo(savedInfo);
        this.activeKeyMemo = { info: savedInfo, expiresAt: Date.now() + ACTIVE_KEY_MEMO_TTL_MS };
        return saved;
    }
    async setActiveKey(id) {
        await this.deploymentKeyRepository.activateDataEncryptionKey(id);
        this.activeKeyMemo = undefined;
    }
    async markInactive(id) {
        await this.deploymentKeyRepository.deactivateDataEncryptionKey(id);
        this.activeKeyMemo = undefined;
    }
    rememberKeyInfo(keyInfo) {
        this.keyInfoById.delete(keyInfo.id);
        this.keyInfoById.set(keyInfo.id, keyInfo);
        if (this.keyInfoById.size > KEY_BY_ID_CACHE_CAPACITY) {
            const oldest = this.keyInfoById.keys().next().value;
            if (oldest !== undefined)
                this.keyInfoById.delete(oldest);
        }
    }
};
exports.KeyManagerService = KeyManagerService;
exports.KeyManagerService = KeyManagerService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.DeploymentKeyRepository, n8n_core_1.Cipher, n8n_core_1.InstanceSettings, backend_common_1.Logger])
], KeyManagerService);
//# sourceMappingURL=key-manager.service.js.map