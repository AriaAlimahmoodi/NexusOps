import type { JSONObject } from '@n8n/agents';
export type AgentSandboxPrincipal = {
    type: 'n8n-user';
    userId: string;
} | {
    type: 'integration-thread';
    connectionId: string;
    platform: string;
    platformThreadId: string;
} | {
    type: 'project-session';
    projectId: string;
    sessionId: string;
} | {
    type: 'workflow-execution';
    workflowId: string;
    executionId: string;
} | {
    type: 'scheduled-task';
    taskId: string;
};
declare const agentSandboxPrincipalHashBrand: unique symbol;
export type AgentSandboxPrincipalHash = string & {
    readonly [agentSandboxPrincipalHashBrand]: true;
};
export interface AgentSandboxPersistenceScope {
    projectId: string;
    principalHash: AgentSandboxPrincipalHash;
}
export declare function isAgentSandboxPrincipalHash(value: string): value is AgentSandboxPrincipalHash;
export declare function encodeAgentSandboxHostMetadata(scope: AgentSandboxPersistenceScope): JSONObject;
export declare function decodeAgentSandboxHostMetadata(hostMetadata: JSONObject | undefined): AgentSandboxPersistenceScope | undefined;
export declare function hashAgentSandboxPrincipal(principal: AgentSandboxPrincipal): AgentSandboxPrincipalHash;
export {};
