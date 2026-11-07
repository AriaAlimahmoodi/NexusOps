import { Logger } from '@n8n/backend-common';
import { DeploymentKeyRepository } from '@n8n/db';
import type { CryptoKey, JWK } from 'jose';
import { Cipher } from 'n8n-core';
import { CacheService } from '@n8n/backend-services';
import { type JweKeyAlgorithm } from './oauth-jwe.constants';
type OAuthJweKeyPair = {
    algorithm: JweKeyAlgorithm;
    privateKey: CryptoKey;
    publicKey: CryptoKey;
    publicJwk: JWK;
    kid: string;
};
export declare class OAuthJweKeyService {
    private readonly deploymentKeyRepository;
    private readonly cipher;
    private readonly cacheService;
    private readonly logger;
    constructor(deploymentKeyRepository: DeploymentKeyRepository, cipher: Cipher, cacheService: CacheService, logger: Logger);
    initialize(): Promise<void>;
    getKeyPair(algorithm?: JweKeyAlgorithm): Promise<OAuthJweKeyPair>;
    getPublicJwk(algorithm?: JweKeyAlgorithm): Promise<JWK>;
    getPublicJwks(): Promise<JWK[]>;
    private findEntry;
    private loadData;
    private unwrapPrivateJwk;
    private deriveKeyPair;
    private loadOrGenerate;
    private readActiveEntry;
    private generateAndPersist;
}
export {};
