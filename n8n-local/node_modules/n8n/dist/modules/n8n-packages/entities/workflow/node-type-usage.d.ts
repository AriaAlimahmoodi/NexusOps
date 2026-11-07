import type { INode } from 'n8n-workflow';
import type { PackageNodeTypeRequirement } from '../../spec/requirements.schema';
import type { RequirementSource } from '../requirement-source';
export type NodeTypeSource = RequirementSource & {
    nodes: Array<Pick<INode, 'type' | 'typeVersion'>>;
};
export type NodeTypeUsage = PackageNodeTypeRequirement;
export declare function collectNodeTypeUsage(sources: NodeTypeSource[]): NodeTypeUsage[];
