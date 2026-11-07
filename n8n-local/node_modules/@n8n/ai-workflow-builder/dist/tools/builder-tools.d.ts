import type { INodeTypeDescription } from 'n8n-workflow';
import type { BuilderToolBase } from '../utils/stream-processor';
import type { BuilderFeatureFlags } from '../workflow-builder-agent';
export declare function getBuilderToolsForDisplay({ nodeTypes, featureFlags, }: {
    nodeTypes: INodeTypeDescription[];
    featureFlags?: BuilderFeatureFlags;
}): BuilderToolBase[];
