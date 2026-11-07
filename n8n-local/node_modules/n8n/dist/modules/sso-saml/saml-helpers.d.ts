import type { SamlAcsDto, SamlPreferences } from '@n8n/api-types';
import type { User } from '@n8n/db';
import type { FlowResult } from 'samlify/types/src/flow';
import type { SamlAttributeMapping, SamlUserAttributes } from './types';
export declare function setSamlLoginEnabled(enabled: boolean): Promise<void>;
export declare function setSamlLoginLabel(label: string): void;
export declare const isSamlPreferences: (candidate: unknown) => candidate is SamlPreferences;
export declare function createUserFromSamlAttributes(attributes: SamlUserAttributes): Promise<User>;
export declare function updateUserFromSamlAttributes(user: User, attributes: SamlUserAttributes): Promise<User>;
type GetMappedSamlReturn = {
    attributes: SamlUserAttributes | undefined;
    missingAttributes: string[];
    rawAttributes: Record<string, unknown>;
};
export declare function getMappedSamlAttributesFromFlowResult(flowResult: FlowResult, attributeMapping: SamlAttributeMapping, jitClaimNames: {
    instanceRole: string | null;
    projectRoles: string | null;
}): GetMappedSamlReturn;
export declare function isConnectionTestRequest(payload: SamlAcsDto): boolean;
export declare function extractTestIdFromRelayState(relayState: string | undefined): string | undefined;
export {};
