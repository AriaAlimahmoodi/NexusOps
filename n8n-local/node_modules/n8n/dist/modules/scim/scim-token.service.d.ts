import { type OperationContext, type User } from '@n8n/db';
import { JwtService, UrlService } from '@n8n/backend-services';
import { ScimApiKeyRepository } from './database/scim-api-key.repository';
export declare class ScimTokenService {
    private readonly apiKeyRepository;
    private readonly jwtService;
    private readonly urlService;
    constructor(apiKeyRepository: ScimApiKeyRepository, jwtService: JwtService, urlService: UrlService);
    private signApiKey;
    getTokenInfoForUser(user: User, ctx?: OperationContext): Promise<{
        hasToken: boolean;
        lastFour: string | null;
    }>;
    findScimApiKeyForUser(user: User, { redact }?: {
        redact?: boolean | undefined;
    }, ctx?: OperationContext): Promise<import("@n8n/db").ApiKey | null>;
    verifyApiKey(apiKey: string, ctx?: OperationContext): Promise<boolean>;
    deleteAllScimApiKeysForUser(user: User, ctx?: OperationContext): Promise<void>;
    rotateScimApiKey(user: User, ctx?: OperationContext): Promise<import("@n8n/db").ApiKey>;
    getScimBaseUrl(): string;
    private redactApiKey;
}
