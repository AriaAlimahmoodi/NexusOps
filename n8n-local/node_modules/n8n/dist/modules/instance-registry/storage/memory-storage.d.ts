import type { InstanceRegistration } from '@n8n/api-types';
import type { InstanceStorage } from './instance-storage.interface';
export declare class MemoryInstanceStorage implements InstanceStorage {
    readonly kind = "memory";
    private localRegistration;
    private lastKnownStateMap;
    register(registration: InstanceRegistration): Promise<void>;
    heartbeat(registration: InstanceRegistration): Promise<void>;
    unregister(instanceKey: string): Promise<void>;
    getAllRegistrations(): Promise<InstanceRegistration[]>;
    getRegistration(instanceKey: string): Promise<InstanceRegistration | null>;
    getLastKnownState(): Promise<Map<string, InstanceRegistration>>;
    saveLastKnownState(state: Map<string, InstanceRegistration>): Promise<void>;
    cleanupStaleMembers(): Promise<number>;
    destroy(): Promise<void>;
}
