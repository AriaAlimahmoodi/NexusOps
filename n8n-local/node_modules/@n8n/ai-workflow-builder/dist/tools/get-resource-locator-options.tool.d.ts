import type { Logger } from '@n8n/backend-common';
import type { INodeTypeDescription } from 'n8n-workflow';
import type { ResourceLocatorCallback } from '../types/callbacks';
import type { BuilderTool, BuilderToolBase } from '../utils/stream-processor';
export declare const GET_RESOURCE_LOCATOR_OPTIONS_TOOL: BuilderToolBase;
export declare function createGetResourceLocatorOptionsTool(nodeTypes: INodeTypeDescription[], resourceLocatorCallback?: ResourceLocatorCallback, logger?: Logger): BuilderTool;
