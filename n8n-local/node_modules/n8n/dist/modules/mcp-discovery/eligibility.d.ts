export type McpDiscoveryEligibilityInput = {
    pickedClaude?: boolean;
    now: number;
    isTrial?: boolean;
    firstLoginAt?: number;
    assistantMutationAt?: number | null;
};
export declare const MCP_DISCOVERY_DELAY_MS: number;
export type McpDiscoveryEligibility = {
    status: 'unknown';
} | {
    status: 'excluded';
    reason: 'trial' | 'assistant' | 'client';
} | {
    status: 'waiting';
    eligibleAt: number;
} | {
    status: 'eligible';
    eligibleAt: number;
};
export declare function evaluateMcpDiscoveryEligibility(input: McpDiscoveryEligibilityInput): McpDiscoveryEligibility;
