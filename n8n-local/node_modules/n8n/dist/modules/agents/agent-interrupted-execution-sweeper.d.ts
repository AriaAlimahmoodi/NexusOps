import { Logger } from '@n8n/backend-common';
import { AgentsConfig } from '@n8n/config';
import { AgentExecutionService } from './agent-execution.service';
import { AgentBackgroundJobService } from './background/agent-background-job.service';
import { AgentWakeService } from './background/agent-wake.service';
import { AgentExecutionRepository } from './repositories/agent-execution.repository';
export declare class AgentInterruptedExecutionSweeper {
    private readonly logger;
    private readonly executionRepository;
    private readonly executionService;
    private readonly backgroundJobService;
    private readonly agentWakeService;
    private readonly agentsConfig;
    static readonly LIVENESS_GRACE_SECONDS: number;
    constructor(logger: Logger, executionRepository: AgentExecutionRepository, executionService: AgentExecutionService, backgroundJobService: AgentBackgroundJobService, agentWakeService: AgentWakeService, agentsConfig: AgentsConfig);
    sweep(signal?: AbortSignal): Promise<void>;
    private stopped;
}
