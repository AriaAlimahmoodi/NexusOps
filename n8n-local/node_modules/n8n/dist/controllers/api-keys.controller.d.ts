import { CreateApiKeyRequestDto, ListApiKeysQueryDto, UpdateApiKeyRequestDto } from '@n8n/api-types';
import { EventService } from '@n8n/backend-services';
import { AuthenticatedRequest } from '@n8n/db';
import type { RequestHandler } from 'express';
import { PublicApiKeyService } from '../services/public-api-key.service';
export declare const isApiKeyAuthEnabledMiddleware: RequestHandler;
export declare class ApiKeysController {
    private readonly eventService;
    private readonly publicApiKeyService;
    constructor(eventService: EventService, publicApiKeyService: PublicApiKeyService);
    createApiKey(req: AuthenticatedRequest, _res: Response, body: CreateApiKeyRequestDto): Promise<{
        id: string;
        generateId(): void;
        createdAt: Date;
        updatedAt: Date;
        setUpdateDate(): void;
        user: import("@n8n/db").User;
        userId: string;
        label: string;
        scopes: import("@n8n/permissions").ApiKeyScope[];
        audience: import("n8n-workflow").ApiKeyAudience;
        lastUsedAt: Date | null;
        apiKey: string;
        rawApiKey: string;
        expiresAt: number | null;
    }>;
    getApiKeys(req: AuthenticatedRequest, _res: Response, query: ListApiKeysQueryDto): Promise<{
        items: {
            id: string;
            generateId(): void;
            createdAt: Date;
            updatedAt: Date;
            setUpdateDate(): void;
            userId: string;
            label: string;
            scopes: import("@n8n/permissions").ApiKeyScope[];
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
        owners: import("@n8n/api-types").ApiKeyOwnerSummary[];
    }>;
    deleteApiKey(req: AuthenticatedRequest, _res: Response, apiKeyId: string): Promise<{
        success: boolean;
    }>;
    updateApiKey(req: AuthenticatedRequest, _res: Response, apiKeyId: string, body: UpdateApiKeyRequestDto): Promise<{
        success: boolean;
    }>;
    rotateApiKey(req: AuthenticatedRequest, _res: Response, apiKeyId: string): Promise<{
        id: string;
        generateId(): void;
        createdAt: Date;
        updatedAt: Date;
        setUpdateDate(): void;
        user: import("@n8n/db").User;
        userId: string;
        label: string;
        scopes: import("@n8n/permissions").ApiKeyScope[];
        audience: import("n8n-workflow").ApiKeyAudience;
        lastUsedAt: Date | null;
        apiKey: string;
        rawApiKey: string;
        expiresAt: number | null;
    }>;
    getApiKeyScopes(req: AuthenticatedRequest, _res: Response): Promise<import("@n8n/permissions").ApiKeyScope[]>;
}
