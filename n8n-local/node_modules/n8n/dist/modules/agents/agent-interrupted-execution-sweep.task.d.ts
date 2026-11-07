import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { AgentInterruptedExecutionSweeper } from './agent-interrupted-execution-sweeper';
export declare class AgentInterruptedExecutionSweepTask implements SystemTask {
    private readonly sweeper;
    readonly name = "agent-interrupted-execution-sweep";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    constructor(sweeper: AgentInterruptedExecutionSweeper);
    run(signal: AbortSignal): Promise<void>;
}
