import { Logger } from '@n8n/backend-common';
import type { ClaimedTask, DispatchDecision, DispatchReporter, TaskHandler } from '@n8n/scheduler';
import { AgentTaskService } from '../agent-task.service';
import { AgentTaskJobRegistrar } from './agent-task-job-registrar';
export declare class AgentTaskTaskHandler implements TaskHandler {
    private logger;
    private readonly agentTaskService;
    private readonly registrar;
    readonly taskType = "agent:scheduled-task";
    constructor(logger: Logger, agentTaskService: AgentTaskService, registrar: AgentTaskJobRegistrar);
    execute(task: ClaimedTask, report: DispatchReporter): Promise<DispatchDecision>;
    private selfHeal;
}
