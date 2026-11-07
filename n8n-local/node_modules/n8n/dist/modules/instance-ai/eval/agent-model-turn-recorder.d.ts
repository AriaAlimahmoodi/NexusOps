import type { FetchFn } from '@n8n/agents';
import type { InstanceAiEvalAgentModelTurnRecord } from '@n8n/api-types';
import type { Logger } from '@n8n/backend-common';
export interface AgentModelTurnRecorder {
    fetch: FetchFn;
    turns: InstanceAiEvalAgentModelTurnRecord[];
    flush(): Promise<void>;
}
export declare function createAgentModelTurnRecorder(baseFetch: FetchFn, logger: Logger): AgentModelTurnRecorder;
