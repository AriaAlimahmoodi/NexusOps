import type { ProtectedResourceRegistry } from '@n8n/backend-services/auth';
export declare function isSameProtectedResource(registry: ProtectedResourceRegistry, requested: string, granted: string): Promise<boolean>;
