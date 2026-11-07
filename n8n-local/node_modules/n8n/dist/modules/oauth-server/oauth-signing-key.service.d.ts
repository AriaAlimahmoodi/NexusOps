import { Logger } from '@n8n/backend-common';
import { DeploymentKeyRepository } from '@n8n/db';
import type { JWK } from 'jose';
import { Cipher } from 'n8n-core';
import { JwtService, type JwtPayload } from '@n8n/backend-services';
type VerifyAccessTokenOptions = {
    kid: unknown;
    audiences: string[];
    issuer: string;
};
export declare class OAuthSigningKeyService {
    private readonly deploymentKeyRepository;
    private readonly cipher;
    private readonly logger;
    private readonly jwtService;
    private activeKey;
    private publishedKeys;
    private pendingRead;
    private keysGeneration;
    constructor(deploymentKeyRepository: DeploymentKeyRepository, cipher: Cipher, logger: Logger, jwtService: JwtService);
    initialize(): Promise<void>;
    signAccessToken(payload: object, audience: string): string;
    getPublicJwks(): Promise<JWK[]>;
    verifyAccessToken(token: string, { kid, audiences, issuer }: VerifyAccessTokenOptions): Promise<JwtPayload>;
    private findPublishedKey;
    private loadPublishedKeys;
    private readPublishedKeys;
    private readPublishedKeyRows;
    private readPrivateJwk;
    private generateAndPersist;
    private broadcastReloadSigningKeysCommand;
    reloadPublishedKeys(): void;
}
export {};
