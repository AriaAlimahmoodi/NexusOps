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
exports.ProjectSecretsProviderAccess = void 0;
const typeorm_1 = require("@n8n/typeorm");
const abstract_entity_1 = require("./abstract-entity");
const project_1 = require("./project");
const secrets_provider_connection_1 = require("./secrets-provider-connection");
let ProjectSecretsProviderAccess = class ProjectSecretsProviderAccess extends abstract_entity_1.WithTimestamps {
};
exports.ProjectSecretsProviderAccess = ProjectSecretsProviderAccess;
__decorate([
    (0, typeorm_1.ManyToOne)('SecretsProviderConnection', 'projectAccess'),
    __metadata("design:type", secrets_provider_connection_1.SecretsProviderConnection)
], ProjectSecretsProviderAccess.prototype, "secretsProviderConnection", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", Number)
], ProjectSecretsProviderAccess.prototype, "secretsProviderConnectionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Project', 'secretsProviderAccess', { eager: true }),
    __metadata("design:type", project_1.Project)
], ProjectSecretsProviderAccess.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], ProjectSecretsProviderAccess.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, default: 'secretsProviderConnection:user' }),
    __metadata("design:type", String)
], ProjectSecretsProviderAccess.prototype, "role", void 0);
exports.ProjectSecretsProviderAccess = ProjectSecretsProviderAccess = __decorate([
    (0, typeorm_1.Entity)()
], ProjectSecretsProviderAccess);
//# sourceMappingURL=project-secrets-provider-access.js.map