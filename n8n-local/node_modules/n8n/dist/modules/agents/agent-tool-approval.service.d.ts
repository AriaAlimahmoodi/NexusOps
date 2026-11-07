import type { ToolApprovalContext } from '@n8n/agents';
import { Telemetry } from '../../telemetry';
import type { StartExecutionParams } from './agent-execution.service';
import { AgentThreadGrantRepository } from './repositories/agent-thread-grant.repository';
import type { ToolRegistry } from './tool-registry';
export declare class AgentToolApprovalService {
    private readonly grants;
    private readonly telemetry;
    constructor(grants: AgentThreadGrantRepository, telemetry: Telemetry);
    createContext({ threadId, agentId, telemetry, source, }: Pick<StartExecutionParams, 'threadId' | 'agentId' | 'telemetry' | 'source'>, toolRegistry?: ToolRegistry): Promise<ToolApprovalContext>;
}
