import { Logger } from '@n8n/backend-common';
import { EncryptionKeyProxy, InstanceSettings } from 'n8n-core';
import { KeyManagerService } from './key-manager.service';
export declare class EncryptionBootstrapService {
    private readonly keyManager;
    private readonly instanceSettings;
    private readonly encryptionKeyProxy;
    private readonly logger;
    constructor(keyManager: KeyManagerService, instanceSettings: InstanceSettings, encryptionKeyProxy: EncryptionKeyProxy, logger: Logger);
    run(): Promise<void>;
    private get canSeed();
}
