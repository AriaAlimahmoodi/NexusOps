import type { InstanceRegistration } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { ExecutionsConfig, ScalingModeConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
export declare class InstanceRegistryService {
    private readonly instanceSettings;
    private readonly executionsConfig;
    private readonly scalingModeConfig;
    private readonly logger;
    private storage;
    private readonly instanceKey;
    private registeredAt;
    constructor(instanceSettings: InstanceSettings, executionsConfig: ExecutionsConfig, scalingModeConfig: ScalingModeConfig, logger: Logger);
    init(): Promise<void>;
    shutdown(): Promise<void>;
    heartbeat(): Promise<void>;
    getAllInstances(): Promise<InstanceRegistration[]>;
    getLocalInstance(): InstanceRegistration;
    getLastKnownState(): Promise<Map<string, InstanceRegistration>>;
    readClusterState(): Promise<{
        instances: InstanceRegistration[];
        lastKnownState: Map<string, InstanceRegistration>;
    }>;
    saveLastKnownState(state: Map<string, InstanceRegistration>): Promise<void>;
    cleanupStaleMembers(): Promise<number>;
    get storageBackend(): 'redis' | 'memory';
    private buildRegistration;
    private selectStorage;
}
