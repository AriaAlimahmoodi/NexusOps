import type { ComputerUseChannel } from '@n8n/api-types';
import type { ComputerUseState } from '@n8n/instance-ai';
export declare function enabledToolCategories(declared: Array<{
    name: string;
    enabled: boolean;
}>): string[];
export declare function resolveComputerUseState({ clientChannels, localGatewayDisabledGlobally, localGatewayDisabledForUser, browserUseEnabledGlobally, localComputerToolCategories, browserConnected, }: {
    clientChannels: readonly ComputerUseChannel[] | undefined;
    localGatewayDisabledGlobally: boolean;
    localGatewayDisabledForUser: boolean;
    browserUseEnabledGlobally: boolean;
    localComputerToolCategories: string[] | undefined;
    browserConnected: boolean;
}): ComputerUseState;
