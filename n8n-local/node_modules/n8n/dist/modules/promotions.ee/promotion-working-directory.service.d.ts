import { InstanceSettings } from 'n8n-core';
import type { PromotionCacheDescriptor } from './promotions.types';
export declare class PromotionWorkingDirectoryService {
    private readonly instanceSettings;
    constructor(instanceSettings: InstanceSettings);
    paths(configId: string): {
        rootFolder: string;
        repositoryFolder: string;
        nextRepositoryFolder: string;
        sshDir: string;
        descriptorFile: string;
    };
    writeDescriptor(descriptor: PromotionCacheDescriptor): Promise<void>;
    readDescriptor(configId: string): Promise<PromotionCacheDescriptor | null>;
    matchesDescriptor(expected: PromotionCacheDescriptor): Promise<boolean>;
    invalidateDescriptor(configId: string): Promise<void>;
    resetCheckout(configId: string): Promise<void>;
    purge(configId: string): Promise<void>;
}
