import { JwtService, UrlService } from '@n8n/backend-services';
export interface TeamsArmTemplateOptions {
    agentName: string;
    agentId: string;
    displayName?: string;
    msaAppId: string;
    msaAppTenantId: string;
    messagingEndpoint: string;
}
export declare class TeamsArmTemplateService {
    private readonly jwtService;
    private readonly urlService;
    constructor(jwtService: JwtService, urlService: UrlService);
    buildTemplate(options: TeamsArmTemplateOptions): Record<string, unknown>;
    buildDeployUrl(projectId: string, agentId: string, credentialId: string): string;
    buildTemplateUrl(projectId: string, agentId: string, credentialId: string): string;
    verifyToken(projectId: string, agentId: string, credentialId: string, token: string): boolean;
    private signToken;
    botNameFor(agentName: string, agentId: string): string;
}
