import type { AgentBackgroundJobDto } from '@n8n/api-types';
import { WithTimestampsAndStringId } from '@n8n/db';
export type AgentBackgroundJobKind = AgentBackgroundJobDto['kind'];
export type AgentBackgroundJobStatus = AgentBackgroundJobDto['status'];
export declare class AgentBackgroundJob extends WithTimestampsAndStringId {
    kind: AgentBackgroundJobKind;
    status: AgentBackgroundJobStatus;
    pauseRequestId: string | null;
    parentAgentId: string;
    parentThreadId: string;
    parentResourceId: string;
    parentPrincipalHash: string;
    title: string;
    subAgentId: string | null;
    childThreadId: string | null;
    childExecutionId: string | null;
    workflowId: string | null;
    timeoutAt: Date | null;
    result: string | null;
    error: string | null;
    settledAt: Date | null;
    notifiedAt: Date | null;
}
