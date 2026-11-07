import type { AgentSessionLangSmithExportResponse } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import type { User } from '@n8n/db';
import { AiService } from '../../services/ai.service';
import { AgentExecutionService } from './agent-execution.service';
import { AgentExecutionThreadRepository } from './repositories/agent-execution-thread.repository';
interface ExportSessionInput {
    projectId: string;
    agentId: string;
    threadId: string;
    user: User;
}
export declare class AgentSessionLangSmithExportService {
    private readonly logger;
    private readonly aiService;
    private readonly outboundHttp;
    private readonly agentExecutionService;
    private readonly threadRepository;
    constructor(logger: Logger, aiService: AiService, outboundHttp: OutboundHttp, agentExecutionService: AgentExecutionService, threadRepository: AgentExecutionThreadRepository);
    exportSession(input: ExportSessionInput): Promise<AgentSessionLangSmithExportResponse>;
    private ensureEnabled;
    private loadSessionTree;
    private ensureSettled;
    private createClient;
}
export {};
