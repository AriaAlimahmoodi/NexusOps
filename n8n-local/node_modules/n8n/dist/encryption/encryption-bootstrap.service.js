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
exports.EncryptionBootstrapService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_core_1 = require("n8n-core");
const key_manager_service_1 = require("./key-manager.service");
const key_rotation_flag_1 = require("./key-rotation-flag");
let EncryptionBootstrapService = class EncryptionBootstrapService {
    constructor(keyManager, instanceSettings, encryptionKeyProxy, logger) {
        this.keyManager = keyManager;
        this.instanceSettings = instanceSettings;
        this.encryptionKeyProxy = encryptionKeyProxy;
        this.logger = logger;
        this.logger = this.logger.scoped('encryption-key-manager');
    }
    async run() {
        if (this.instanceSettings.instanceType === 'main' && this.canSeed) {
            try {
                await this.keyManager.repairLegacyDataEncryptionKeys();
                await this.keyManager.bootstrapLegacyCbcKey(this.instanceSettings.encryptionKey);
                await this.keyManager.bootstrapGcmKey();
            }
            catch (error) {
                if ((0, key_rotation_flag_1.isKeyRotationEnabled)())
                    throw error;
                this.logger.warn('Encryption key seeding failed, will retry on next startup', {
                    error: (0, ensure_error_1.ensureError)(error),
                });
            }
        }
        this.encryptionKeyProxy.setProvider(this.keyManager);
        this.logger.debug('Encryption key bootstrap complete');
    }
    get canSeed() {
        return this.instanceSettings.canSeedDeploymentState;
    }
};
exports.EncryptionBootstrapService = EncryptionBootstrapService;
exports.EncryptionBootstrapService = EncryptionBootstrapService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [key_manager_service_1.KeyManagerService, n8n_core_1.InstanceSettings, n8n_core_1.EncryptionKeyProxy, backend_common_1.Logger])
], EncryptionBootstrapService);
//# sourceMappingURL=encryption-bootstrap.service.js.map