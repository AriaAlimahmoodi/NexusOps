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
exports.TeamsCredentialNotesService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const di_1 = require("@n8n/di");
const credentials_service_1 = require("../../../../../credentials/credentials.service");
const teams_entra_provisioning_service_1 = require("./teams-entra-provisioning.service");
const integration_helpers_1 = require("../../integration-helpers");
let TeamsCredentialNotesService = class TeamsCredentialNotesService {
    constructor(credentialsFinderService, credentialsService, logger) {
        this.credentialsFinderService = credentialsFinderService;
        this.credentialsService = credentialsService;
        this.logger = logger;
    }
    async write(user, credentialId, notes) {
        try {
            const credential = await this.credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:update']);
            if (credential?.type !== teams_entra_provisioning_service_1.BOT_CREDENTIAL_TYPE)
                return;
            const current = await this.credentialsService.decrypt(credential, true);
            if (!(0, integration_helpers_1.stringProperty)(current, 'clientId'))
                return;
            if (Object.entries(notes).every(([key, value]) => current[key] === value))
                return;
            const updated = { ...current, ...notes };
            const encrypted = await this.credentialsService.createEncryptedData({
                id: credential.id,
                name: credential.name,
                type: credential.type,
                data: updated,
            });
            await this.credentialsService.update(credential.id, encrypted, { kind: 'user', user }, updated);
        }
        catch (error) {
            this.logger.warn('[Teams] Could not write a note on the channel credential', {
                credentialId,
                notes: Object.keys(notes),
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
};
exports.TeamsCredentialNotesService = TeamsCredentialNotesService;
exports.TeamsCredentialNotesService = TeamsCredentialNotesService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.CredentialsFinderService, credentials_service_1.CredentialsService, backend_common_1.Logger])
], TeamsCredentialNotesService);
//# sourceMappingURL=teams-credential-notes.service.js.map