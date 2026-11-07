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
exports.AgentCredentialLookupService = void 0;
const di_1 = require("@n8n/di");
const credentials_service_1 = require("../../../credentials/credentials.service");
let AgentCredentialLookupService = class AgentCredentialLookupService {
    constructor(credentialsService) {
        this.credentialsService = credentialsService;
    }
    async decryptForUser(user, projectId, credentialId, expectedType) {
        const usable = await this.credentialsService.getCredentialsAUserCanUseInAWorkflow(user, {
            projectId,
            excludePersonalRoute: true,
        });
        if (!usable.some((item) => item.id === credentialId))
            return null;
        return await this.decryptForProject(projectId, credentialId, expectedType);
    }
    async decryptForProject(projectId, credentialId, expectedType) {
        const projectCredentials = await this.credentialsService.findAllCredentialIdsForProject(projectId);
        const credential = projectCredentials.find((item) => item.id === credentialId) ??
            (await this.credentialsService.findAllGlobalCredentialIds(true)).find((item) => item.id === credentialId);
        if (!credential || credential.type !== expectedType)
            return null;
        return await this.credentialsService.decrypt(credential, true);
    }
};
exports.AgentCredentialLookupService = AgentCredentialLookupService;
exports.AgentCredentialLookupService = AgentCredentialLookupService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [credentials_service_1.CredentialsService])
], AgentCredentialLookupService);
//# sourceMappingURL=agent-credential-lookup.service.js.map