import { type NodeTypeUsage } from './node-type-usage';
import type { PreparedWorkflow } from './workflow-import.types';
import type { MissingNodeTypeMode } from '../../n8n-packages.types';
export type MissingNodeTypeRequirement = NodeTypeUsage;
export declare function collectMissingNodeTypes(workflows: PreparedWorkflow[], getSupportedVersions: (nodeType: string) => number[] | undefined): MissingNodeTypeRequirement[];
export declare function missingNodeTypeBlockingFailures(mode: MissingNodeTypeMode, missing: MissingNodeTypeRequirement[]): MissingNodeTypeRequirement[];
export declare function workflowsWithMissingNodeTypes(missing: MissingNodeTypeRequirement[]): Set<string>;
