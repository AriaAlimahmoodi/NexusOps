import type { ApiKeyAudience, ApiKeyOwnerSummary, CreateApiKeyRequestDto, UpdateApiKeyRequestDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { ApiKey, ApiKeyRepository } from '@n8n/db';
import type { ApiKeyScope, AuthPrincipal } from '@n8n/permissions';
import { type EntityManager } from '@n8n/typeorm';
import { UserManagementMailer } from '../user-management/email';
import { JwtService } from '@n8n/backend-services';
export declare const API_KEY_AUDIENCE: ApiKeyAudience;
export declare const API_KEY_ISSUER = "n8n";
export declare const PREFIX_LEGACY_API_KEY = "n8n_api_";
export declare class PublicApiKeyService {
    private readonly apiKeyRepository;
    private readonly jwtService;
    private readonly mailer;
    private readonly logger;
    constructor(apiKeyRepository: ApiKeyRepository, jwtService: JwtService, mailer: UserManagementMailer, logger: Logger);
    createPublicApiKeyForUser(user: User, { label, expiresAt, scopes }: CreateApiKeyRequestDto): Promise<ApiKey>;
    getRedactedApiKeys(caller: User, options?: {
        take?: number;
        skip?: number;
        ownership?: 'mine' | 'all';
        label?: string;
        ownerIds?: string[];
        sortBy?: string;
    }): Promise<{
        items: {
            id: string;
            generateId(): void;
            createdAt: Date;
            updatedAt: Date;
            setUpdateDate(): void;
            userId: string;
            label: string;
            scopes: ApiKeyScope[];
            audience: import("n8n-workflow").ApiKeyAudience;
            lastUsedAt: Date | null;
            apiKey: string;
            expiresAt: number | null;
            owner: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
            };
        }[];
        counts: {
            mine: number;
            all: number;
        };
        totals: {
            mine: number;
            all: number;
        };
        owners: ApiKeyOwnerSummary[];
    }>;
    private getApiKeyOwners;
    private countApiKeys;
    private applyApiKeyListSort;
    deleteApiKey(caller: User, apiKeyId: string): Promise<{
        isOwn: boolean;
    }>;
    deleteAllApiKeysForUser(user: User, tx?: EntityManager): Promise<import("@n8n/typeorm").DeleteResult[]>;
    updateApiKeyForUser(user: User, apiKeyId: string, { label, scopes }: UpdateApiKeyRequestDto): Promise<void>;
    rotateApiKey(user: User, apiKeyId: string): Promise<ApiKey>;
    private toRedactedApiKey;
    redactApiKey(apiKey: string): string;
    private generateApiKey;
    getApiKeyExpiration: (apiKey: string) => number | null;
    apiKeyHasValidScopesForRole(role: AuthPrincipal, apiKeyScopes: ApiKeyScope[]): boolean;
    apiKeyHasValidScopes(apiKey: string, endpointScope: ApiKeyScope): Promise<boolean>;
    removeOwnerOnlyScopesFromApiKeys(user: User, tx?: EntityManager): Promise<import("@n8n/typeorm").UpdateResult[]>;
}
