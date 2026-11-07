export interface McpDiscoveryState {
    status: 'inactive' | 'unknown' | 'waiting' | 'excluded' | 'assigned';
    eligibleAt?: number;
    hasConnectedClaude?: boolean;
    hasUsedMcp?: boolean;
}
