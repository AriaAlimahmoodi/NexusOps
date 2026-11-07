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
exports.OwnerInstanceSettingsLoader = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const zod_1 = require("zod");
const ownership_service_1 = require("../../services/ownership.service");
const instance_bootstrapping_error_1 = require("../instance-bootstrapping.error");
const BCRYPT_HASH_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const ownerEnvSchema = zod_1.z
    .object({
    ownerEmail: zod_1.z
        .string()
        .min(1, 'N8N_INSTANCE_OWNER_EMAIL is required when N8N_INSTANCE_OWNER_MANAGED_BY_ENV is true'),
    ownerPasswordHash: zod_1.z
        .string()
        .min(1, 'N8N_INSTANCE_OWNER_PASSWORD_HASH is required when N8N_INSTANCE_OWNER_MANAGED_BY_ENV is true')
        .regex(BCRYPT_HASH_RE, 'N8N_INSTANCE_OWNER_PASSWORD_HASH is not a valid bcrypt hash. Provide a pre-hashed bcrypt string.'),
    ownerFirstName: zod_1.z.string(),
    ownerLastName: zod_1.z.string(),
})
    .transform(({ ownerEmail, ownerPasswordHash, ownerFirstName, ownerLastName }) => ({
    payload: {
        email: ownerEmail,
        firstName: ownerFirstName,
        lastName: ownerLastName,
        password: ownerPasswordHash,
    },
    options: { overwriteExisting: true, passwordIsHashed: true },
}));
let OwnerInstanceSettingsLoader = class OwnerInstanceSettingsLoader {
    constructor(instanceSettingsLoaderConfig, ownershipService, logger) {
        this.instanceSettingsLoaderConfig = instanceSettingsLoaderConfig;
        this.ownershipService = ownershipService;
        this.logger = logger;
        this.logger = this.logger.scoped('instance-settings-loader');
    }
    async run() {
        const { ownerManagedByEnv } = this.instanceSettingsLoaderConfig;
        if (!ownerManagedByEnv) {
            this.logger.debug('Owner is not managed by environment variables, skipping');
            return 'skipped';
        }
        this.logger.info('N8N_INSTANCE_OWNER_MANAGED_BY_ENV is enabled — applying owner env vars');
        const result = ownerEnvSchema.safeParse(this.instanceSettingsLoaderConfig);
        if (!result.success) {
            throw new instance_bootstrapping_error_1.InstanceBootstrappingError(result.error.issues[0].message);
        }
        await this.ownershipService.setupOwner(result.data.payload, result.data.options);
        return 'created';
    }
};
exports.OwnerInstanceSettingsLoader = OwnerInstanceSettingsLoader;
exports.OwnerInstanceSettingsLoader = OwnerInstanceSettingsLoader = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.InstanceSettingsLoaderConfig, ownership_service_1.OwnershipService, backend_common_1.Logger])
], OwnerInstanceSettingsLoader);
//# sourceMappingURL=owner.instance-settings-loader.js.map