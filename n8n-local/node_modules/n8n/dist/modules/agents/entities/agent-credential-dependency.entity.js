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
exports.AgentCredentialDependency = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let AgentCredentialDependency = class AgentCredentialDependency extends db_1.WithCreatedAt {
};
exports.AgentCredentialDependency = AgentCredentialDependency;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AgentCredentialDependency.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Agent', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'agentId' }),
    __metadata("design:type", Object)
], AgentCredentialDependency.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AgentCredentialDependency.prototype, "credentialId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('CredentialsEntity', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'credentialId' }),
    __metadata("design:type", Object)
], AgentCredentialDependency.prototype, "credential", void 0);
exports.AgentCredentialDependency = AgentCredentialDependency = __decorate([
    (0, typeorm_1.Entity)({ name: 'agent_credential_dependency' })
], AgentCredentialDependency);
//# sourceMappingURL=agent-credential-dependency.entity.js.map