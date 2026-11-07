import { type SerializableAgentState } from '@n8n/agents';
import type { IntegrationMessageContext } from '../integrations/integration-tool-types';
export declare const BACKGROUND_SUB_AGENT_METADATA_KEY = "n8nBackgroundSubAgent";
export declare const BACKGROUND_APPROVAL_RUN_PREFIX = "background-job-";
export declare const BACKGROUND_PAUSE_USER_TURN_KEY = "n8nBackgroundPauseUserTurn";
export declare const PARENT_TASK_CANCELLED_REASON: DOMException;
export declare function parseBackgroundApprovalAction(actionId: string): {
    runId: string;
    toolCallId: string;
    resumeData: {
        approved: boolean;
        scope?: "once" | "session" | undefined;
    };
} | undefined;
export declare function readBackgroundSubAgentState(checkpoint: SerializableAgentState): {
    jobId: string;
    resumeContext: {
        agentId: string;
        versionId?: string | undefined;
    };
    runtimeSnapshot?: string | undefined;
    difficulty?: "high" | "low" | "medium" | undefined;
    sharedWorkspace: boolean;
    messageContext: IntegrationMessageContext | null;
    taskPath: import("@n8n/agents").SubAgentTaskPath;
} | undefined;
