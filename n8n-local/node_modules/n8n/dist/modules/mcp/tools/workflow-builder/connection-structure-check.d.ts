import { type INodeOutputConfiguration, type NodeConnectionType } from 'n8n-workflow';
import type { NodeTypes } from '../../../../node-types';
import type { Telemetry } from '../../../../telemetry';
import type { UserCalledMCPToolEventPayload } from '../../mcp.types';
export type NodeOutputsResolver = (type: string, version: number) => Array<NodeConnectionType | INodeOutputConfiguration> | undefined;
export interface InvalidAiToolSource {
    sourceNode: string;
    sourceType: string;
    targets: string[];
}
export interface WorkflowForToolSourceCheck {
    nodes: ReadonlyArray<{
        name?: string;
        type: string;
        typeVersion?: number;
    }>;
    connections: {
        [sourceNode: string]: {
            [connectionType: string]: Array<Array<{
                node: string;
            }> | null>;
        };
    };
}
export declare function findInvalidAiToolSources(workflow: WorkflowForToolSourceCheck, resolveOutputs: NodeOutputsResolver): InvalidAiToolSource[];
export declare function formatInvalidAiToolSourceMessage(violations: InvalidAiToolSource[]): string;
export declare function createNodeOutputsResolver(nodeTypes: NodeTypes): NodeOutputsResolver;
export declare function buildInvalidAiToolSourceErrorResponse<T extends Record<string, unknown>>(workflow: WorkflowForToolSourceCheck, nodeTypes: NodeTypes, buildOutput: (errorMessage: string) => T, telemetryPayload: UserCalledMCPToolEventPayload, telemetry: Telemetry): {
    content: Array<{
        type: 'text';
        text: string;
    }>;
    structuredContent: T;
    isError: true;
} | null;
