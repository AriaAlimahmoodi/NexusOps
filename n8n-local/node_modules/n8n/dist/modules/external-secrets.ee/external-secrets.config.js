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
exports.ExternalSecretsConfig = void 0;
const config_1 = require("@n8n/config");
const zod_1 = require("zod");
const timeoutSeconds = zod_1.z.coerce.number().int().gte(1).lte(2_147_483);
let ExternalSecretsConfig = class ExternalSecretsConfig {
    constructor() {
        this.updateInterval = 300;
        this.connectTimeout = 20;
        this.refreshTimeout = 20;
        this.preferGet = false;
        this.externalSecretsForProjects = true;
        this.externalSecretsMultipleConnections = true;
        this.externalSecretsRoleBasedAccess = true;
    }
};
exports.ExternalSecretsConfig = ExternalSecretsConfig;
__decorate([
    (0, config_1.Env)('N8N_EXTERNAL_SECRETS_UPDATE_INTERVAL', timeoutSeconds),
    __metadata("design:type", Number)
], ExternalSecretsConfig.prototype, "updateInterval", void 0);
__decorate([
    (0, config_1.Env)('N8N_EXTERNAL_SECRETS_CONNECT_TIMEOUT', timeoutSeconds),
    __metadata("design:type", Number)
], ExternalSecretsConfig.prototype, "connectTimeout", void 0);
__decorate([
    (0, config_1.Env)('N8N_EXTERNAL_SECRETS_REFRESH_TIMEOUT', timeoutSeconds),
    __metadata("design:type", Number)
], ExternalSecretsConfig.prototype, "refreshTimeout", void 0);
__decorate([
    (0, config_1.Env)('N8N_EXTERNAL_SECRETS_PREFER_GET'),
    __metadata("design:type", Boolean)
], ExternalSecretsConfig.prototype, "preferGet", void 0);
__decorate([
    (0, config_1.Env)('N8N_ENV_FEAT_EXTERNAL_SECRETS_FOR_PROJECTS'),
    __metadata("design:type", Boolean)
], ExternalSecretsConfig.prototype, "externalSecretsForProjects", void 0);
__decorate([
    (0, config_1.Env)('N8N_ENV_FEAT_EXTERNAL_SECRETS_MULTIPLE_CONNECTIONS'),
    __metadata("design:type", Boolean)
], ExternalSecretsConfig.prototype, "externalSecretsMultipleConnections", void 0);
__decorate([
    (0, config_1.Env)('N8N_ENV_FEAT_EXTERNAL_SECRETS_ROLE_BASED_ACCESS'),
    __metadata("design:type", Boolean)
], ExternalSecretsConfig.prototype, "externalSecretsRoleBasedAccess", void 0);
exports.ExternalSecretsConfig = ExternalSecretsConfig = __decorate([
    config_1.Config
], ExternalSecretsConfig);
//# sourceMappingURL=external-secrets.config.js.map