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
exports.ChatHubCredentialsService = void 0;
const api_types_1 = require("@n8n/api-types");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const backend_services_1 = require("@n8n/backend-services");
const credentials_service_1 = require("../../credentials/credentials.service");
const errors_1 = require("@n8n/errors");
let ChatHubCredentialsService = class ChatHubCredentialsService {
    constructor(credentialsService, sharedWorkflowRepository, credentialsFinderService, projectRepository) {
        this.credentialsService = credentialsService;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.credentialsFinderService = credentialsFinderService;
        this.projectRepository = projectRepository;
    }
    async ensureCredentialAccess(user, credentialId) {
        const credential = await this.credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:read']);
        if (!credential) {
            throw new errors_1.ForbiddenError("You don't have access to the provided credentials");
        }
        return credential;
    }
    pickCredentialId(provider, credentials) {
        if (provider === 'n8n' || provider === 'custom-agent') {
            return null;
        }
        return credentials[api_types_1.PROVIDER_CREDENTIAL_TYPE_MAP[provider]]?.id ?? null;
    }
    async findPersonalProject(user, trx) {
        const project = await this.projectRepository.getPersonalProjectForUser(user.id, trx);
        if (!project) {
            throw new errors_1.ForbiddenError('Missing personal project');
        }
        return project;
    }
    findProviderCredential(provider, credentials) {
        const credentialId = this.pickCredentialId(provider, credentials);
        if (!credentialId) {
            throw new errors_1.BadRequestError('No credentials provided for the selected model provider');
        }
        return credentialId;
    }
    async findWorkflowCredentialAndProject(provider, credentials, workflowId) {
        const credentialId = this.pickCredentialId(provider, credentials);
        if (!credentialId) {
            throw new errors_1.BadRequestError('No credentials provided for the selected model provider');
        }
        const project = await this.sharedWorkflowRepository.getWorkflowOwningProject(workflowId);
        if (!project) {
            throw new errors_1.ForbiddenError('Missing owner project for the workflow');
        }
        const workflowCredentials = await this.credentialsService.findAllCredentialIdsForWorkflow(workflowId);
        const globalCredentials = await this.credentialsService.findAllGlobalCredentialIds();
        workflowCredentials.push.apply(workflowCredentials, globalCredentials);
        const credential = workflowCredentials.find((c) => c.id === credentialId);
        if (!credential) {
            throw new errors_1.ForbiddenError("You don't have access to the provided credentials");
        }
        return {
            credentialId: credential.id,
            projectId: project.id,
        };
    }
};
exports.ChatHubCredentialsService = ChatHubCredentialsService;
exports.ChatHubCredentialsService = ChatHubCredentialsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [credentials_service_1.CredentialsService, db_1.SharedWorkflowRepository, backend_services_1.CredentialsFinderService, db_1.ProjectRepository])
], ChatHubCredentialsService);
//# sourceMappingURL=chat-hub-credentials.service.js.map