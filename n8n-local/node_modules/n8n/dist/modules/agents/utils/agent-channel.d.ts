export interface IntegrationRef {
    type: string;
    credentialId: string;
}
export interface AgentChannelRef {
    agentId: string;
    integrationType: string;
    credentialId: string;
}
export declare function agentChannelRef(agentId: string, integration: IntegrationRef): AgentChannelRef;
export declare function agentChannelKey(ref: AgentChannelRef): string;
