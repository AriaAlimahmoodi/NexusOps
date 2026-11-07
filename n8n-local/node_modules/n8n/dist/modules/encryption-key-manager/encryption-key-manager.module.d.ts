import type { ModuleInterface } from '@n8n/decorators';
export declare class EncryptionKeyManagerModule implements ModuleInterface {
    init(): Promise<void>;
    settings(): Promise<{
        rotationEnabled: boolean;
    }>;
}
