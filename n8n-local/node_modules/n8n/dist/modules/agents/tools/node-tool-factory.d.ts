import type { BuiltTool } from '@n8n/agents';
import type { AgentJsonToolConfig } from '@n8n/api-types';
import { type EphemeralNodeExecutor } from '../../../node-execution';
import type { InstrumentToolAdditionalData } from '../agent-runtime-instrumentation';
export interface NodeToolFactoryContext {
    executor: EphemeralNodeExecutor;
    projectId: string;
    instrumentToolAdditionalData?: InstrumentToolAdditionalData;
}
export declare function resolveNodeTool(toolSchema: Extract<AgentJsonToolConfig, {
    type: 'node';
}>, ctx: NodeToolFactoryContext): Promise<BuiltTool>;
