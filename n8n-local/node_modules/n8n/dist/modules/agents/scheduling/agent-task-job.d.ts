export declare const AGENT_TASK_TASK_TYPE = "agent:scheduled-task";
export interface AgentTaskJobPayload {
    agentId: string;
    taskId: string;
}
export declare const isAgentTaskJobPayload: (payload: Record<string, unknown>) => payload is Record<string, unknown> & AgentTaskJobPayload;
export declare function agentTaskJobName(agentId: string, taskId: string): string;
