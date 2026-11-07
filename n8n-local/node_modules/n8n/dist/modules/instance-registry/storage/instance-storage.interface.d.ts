import type { InstanceRegistration } from '@n8n/api-types';
export interface InstanceStorage {
    kind: 'redis' | 'memory';
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
