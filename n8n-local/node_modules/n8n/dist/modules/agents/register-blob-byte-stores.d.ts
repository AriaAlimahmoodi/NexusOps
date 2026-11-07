import type { ExecutionDataJsonStore } from '../../executions/execution-data/execution-data-json-store';
import type { AgentKnowledgeFileStore } from './agent-knowledge-file-store';
import type { AgentExecutionLogStore } from './execution-log/agent-execution-log-store';
export declare function registerAgentBlobByteStores(stores: {
    executionDataJsonStore: ExecutionDataJsonStore;
    agentExecutionLogStore: AgentExecutionLogStore;
    agentKnowledgeFileStore: AgentKnowledgeFileStore;
}): Promise<void>;
