import type { INode } from 'n8n-workflow';
export declare const AGENT_NODE_TYPE = "@n8n/n8n-nodes-langchain.agent";
export declare function getAgentNodesBelowFirstSupportedVersion(nodesGroupedByType: Map<string, INode[]>): INode[];
export declare function getRemovedAgentMode(node: INode): string | undefined;
