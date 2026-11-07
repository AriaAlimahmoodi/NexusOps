import type { AgentPersistedMessageDto } from '@n8n/api-types';
import type { AgentExecution } from '../entities/agent-execution.entity';
type ExecutionTranscript = Pick<AgentExecution, 'id' | 'userMessage' | 'author' | 'timeline' | 'attachments' | 'status' | 'error' | 'createdAt' | 'inputMessages'>;
export declare function executionToMessagesDto(execution: ExecutionTranscript): AgentPersistedMessageDto[];
export declare function executionsToMessagesDto(executions: ExecutionTranscript[]): AgentPersistedMessageDto[];
export {};
