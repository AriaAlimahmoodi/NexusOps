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
exports.InstanceCredentialBroker = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const credentials_service_1 = require("./credentials.service");
const instance_credential_use_registry_1 = require("./instance-credential-use.registry");
let InstanceCredentialBroker = class InstanceCredentialBroker {
    constructor(logger, useRegistry, assignmentRepository, credentialsService) {
        this.logger = logger;
        this.useRegistry = useRegistry;
        this.assignmentRepository = assignmentRepository;
        this.credentialsService = credentialsService;
    }
    registerUse(credentialUse) {
        this.useRegistry.register(credentialUse);
    }
    async listForUse(credentialUse) {
        const registeredUse = this.useRegistry.get(credentialUse.id);
        return await this.assignmentRepository.findAvailableCredentials(registeredUse.credentialTypes);
    }
    async assignForUse(credentialUse, credentialId, ctx) {
        const registeredUse = this.useRegistry.get(credentialUse.id);
        const credentialUseId = registeredUse.id;
        const credential = await this.assignmentRepository.assignCredential(credentialUseId, credentialId, registeredUse.credentialTypes, ctx);
        if (!credential)
            throw this.invalidCredentialError(credentialUseId, credentialId);
        this.logger.debug('Assigned instance credential', { credentialUseId, credentialId });
        return { id: credential.id, name: credential.name, type: credential.type };
    }
    async clearForUse(credentialUse, ctx) {
        this.useRegistry.get(credentialUse.id);
        await this.assignmentRepository.clearCredential(credentialUse.id, ctx);
    }
    async getAssignedCredentialId(credentialUse, ctx) {
        this.useRegistry.get(credentialUse.id);
        return await this.assignmentRepository.findAssignedCredentialId(credentialUse.id, ctx);
    }
    async resolveForUse(credentialUse, ctx) {
        const registeredUse = this.useRegistry.get(credentialUse.id);
        const credentialUseId = registeredUse.id;
        const assignment = await this.assignmentRepository.findAssignedCredential(credentialUseId, registeredUse.credentialTypes, ctx);
        if (!assignment)
            return null;
        const { credentialId, credential } = assignment;
        if (!credential)
            throw this.invalidCredentialError(credentialUseId, credentialId);
        const resolved = {
            id: credential.id,
            name: credential.name,
            type: credential.type,
            data: await this.credentialsService.decrypt(credential, true),
        };
        this.logger.debug('Resolved instance credential', {
            credentialUseId,
            credentialId: credential.id,
        });
        return resolved;
    }
    invalidCredentialError(credentialUseId, credentialId) {
        return new errors_1.UnprocessableRequestError(`Credential "${credentialId}" is not valid for instance credential use "${credentialUseId}"`);
    }
};
exports.InstanceCredentialBroker = InstanceCredentialBroker;
exports.InstanceCredentialBroker = InstanceCredentialBroker = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, instance_credential_use_registry_1.InstanceCredentialUseRegistry, db_1.InstanceCredentialAssignmentRepository, credentials_service_1.CredentialsService])
], InstanceCredentialBroker);
//# sourceMappingURL=instance-credential-broker.js.map