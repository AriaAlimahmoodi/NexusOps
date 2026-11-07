import type { INodeTypeDescription } from 'n8n-workflow';
import type { BuilderTool, BuilderToolBase } from '../utils/stream-processor';
export declare const VALIDATE_CONFIGURATION_TOOL: BuilderToolBase;
export declare function createValidateConfigurationTool(parsedNodeTypes: INodeTypeDescription[]): BuilderTool;
