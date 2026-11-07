import type { DiscoverDataPublic } from '@n8n/api-types';
import '../../controllers';
export interface DiscoverOptions {
    includeSchemas?: boolean;
    resource?: string;
    operation?: string;
}
export declare function buildDiscoverResponse(callerScopes: readonly string[], options?: DiscoverOptions): Promise<DiscoverDataPublic>;
export declare function _resetCache(): void;
