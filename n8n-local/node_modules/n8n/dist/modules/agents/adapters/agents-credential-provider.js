"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsCredentialProvider = void 0;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const credentials_helper_1 = require("../../../credentials-helper");
const ai_gateway_service_1 = require("../../../services/ai-gateway.service");
const decrypt_agent_credential_1 = require("../utils/decrypt-agent-credential");
function toResolvedCredential(data) {
    const resolved = data !== null && typeof data === 'object' && !Array.isArray(data) ? data : {};
    const apiKey = 'apiKey' in resolved && typeof resolved.apiKey === 'string' ? resolved.apiKey : '';
    return { ...resolved, apiKey };
}
class AgentsCredentialProvider {
    constructor(credentialsService, projectId, user, agentId) {
        this.credentialsService = credentialsService;
        this.projectId = projectId;
        this.user = user;
        this.agentId = agentId;
    }
    async resolveAiGatewayModelCredential(provider) {
        const credentialType = await di_1.Container.get(ai_gateway_service_1.AiGatewayService).getCredentialTypeForProvider(provider);
        if (!credentialType) {
            throw new n8n_workflow_1.UserError(`Gateway credits do not support the "${provider}" model provider.`);
        }
        return await this.mintGatewayCredential(credentialType);
    }
    async resolveAiGatewaySearchCredential(credentialType) {
        return toResolvedCredential(await this.mintGatewayCredential(credentialType));
    }
    async mintGatewayCredential(credentialType) {
        return await di_1.Container.get(ai_gateway_service_1.AiGatewayService).getSyntheticCredential({
            credentialType,
            userId: this.user?.id,
            projectId: this.projectId,
            agentId: this.agentId,
        });
    }
    async resolve(credentialId) {
        const credential = await this.findCredentialEntity(credentialId);
        if (!credential) {
            throw new Error(`Credential "${credentialId}" not found or not accessible`);
        }
        const data = await (0, decrypt_agent_credential_1.decryptAgentCredential)(di_1.Container.get(credentials_helper_1.CredentialsHelper), credential, {
            userId: this.user?.id,
            projectId: this.projectId,
        });
        return toResolvedCredential(data);
    }
    async list() {
        if (this.user) {
            const accessible = await this.getUserAccessibleCredentials();
            return accessible.map((c) => ({
                id: c.id,
                name: c.name,
                type: c.type,
            }));
        }
        const accessible = await this.getAllProjectAndGlobalCredentials();
        return accessible.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
        }));
    }
    async findCredentialEntity(credentialId) {
        if (this.user) {
            const userAccessible = await this.getUserAccessibleCredentials();
            if (!userAccessible.some((c) => c.id === credentialId))
                return null;
        }
        const accessible = await this.getAllProjectAndGlobalCredentials();
        return accessible.find((c) => c.id === credentialId) ?? null;
    }
    async getUserAccessibleCredentials() {
        if (!this.user)
            return [];
        return await this.credentialsService.getCredentialsAUserCanUseInAWorkflow(this.user, {
            projectId: this.projectId,
            excludePersonalRoute: true,
        });
    }
    async getAllProjectAndGlobalCredentials() {
        const projectCredentials = await this.credentialsService.findAllCredentialIdsForProject(this.projectId);
        const globalCredentials = await this.credentialsService.findAllGlobalCredentialIds();
        const allCredsSet = new Set();
        const allCreds = [];
        const addCreds = (creds) => {
            for (const cred of creds) {
                if (!allCredsSet.has(cred.id)) {
                    allCredsSet.add(cred.id);
                    allCreds.push(cred);
                }
            }
        };
        addCreds(projectCredentials);
        addCreds(globalCredentials);
        return allCreds;
    }
}
exports.AgentsCredentialProvider = AgentsCredentialProvider;
//# sourceMappingURL=agents-credential-provider.js.map