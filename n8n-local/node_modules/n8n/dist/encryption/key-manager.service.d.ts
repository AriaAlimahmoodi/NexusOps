import type { ListEncryptionKeysQueryDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { DeploymentKeyRepository, type DeploymentKey } from '@n8n/db';
import { Cipher, InstanceSettings, type CipherAlgorithm, type IEncryptionKeyProvider, type KeyInfo } from 'n8n-core';
export declare class KeyManagerService implements IEncryptionKeyProvider {
    private readonly deploymentKeyRepository;
    private readonly cipher;
    private readonly instanceSettings;
    private readonly logger;
    private cachedInstanceKeyInfo?;
    private cachedStoredLegacyKey?;
    private readonly keyInfoById;
    private activeKeyMemo?;
    constructor(deploymentKeyRepository: DeploymentKeyRepository, cipher: Cipher, instanceSettings: InstanceSettings, logger: Logger);
    getActiveKey(): Promise<KeyInfo>;
    getKeyById(id: string): Promise<KeyInfo | null>;
    private recoverLegacyDek;
    repairLegacyDataEncryptionKeys(): Promise<void>;
    getLegacyKey(): Promise<KeyInfo>;
    bootstrapLegacyCbcKey(instanceEncryptionKey: string): Promise<void>;
    private instanceKeyLegacyInfo;
    bootstrapGcmKey(): Promise<void>;
    listKeys(query: ListEncryptionKeysQueryDto): Promise<{
        items: DeploymentKey[];
        count: number;
    }>;
    rotateKey(): Promise<DeploymentKey>;
    addKey(plaintextValue: string, algorithm: CipherAlgorithm, setAsActive?: boolean): Promise<DeploymentKey>;
    setActiveKey(id: string): Promise<void>;
    markInactive(id: string): Promise<void>;
    private rememberKeyInfo;
}
