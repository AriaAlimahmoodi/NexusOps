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
exports.SecretsProviderConnection = void 0;
const typeorm_1 = require("@n8n/typeorm");
const abstract_entity_1 = require("./abstract-entity");
let SecretsProviderConnection = class SecretsProviderConnection extends abstract_entity_1.WithTimestamps {
};
exports.SecretsProviderConnection = SecretsProviderConnection;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SecretsProviderConnection.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SecretsProviderConnection.prototype, "providerKey", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SecretsProviderConnection.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('ProjectSecretsProviderAccess', 'secretsProviderConnection', { eager: true }),
    __metadata("design:type", Array)
], SecretsProviderConnection.prototype, "projectAccess", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SecretsProviderConnection.prototype, "encryptedSettings", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], SecretsProviderConnection.prototype, "isEnabled", void 0);
exports.SecretsProviderConnection = SecretsProviderConnection = __decorate([
    (0, typeorm_1.Entity)()
], SecretsProviderConnection);
//# sourceMappingURL=secrets-provider-connection.js.map