import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { type INodeTypeDescription, type Logger } from 'n8n-workflow';
import type { BuilderTool, BuilderToolBase } from '../utils/stream-processor';
export declare const UPDATING_NODE_PARAMETER_TOOL: BuilderToolBase;
export declare function createUpdateNodeParametersTool(nodeTypes: INodeTypeDescription[], llm: BaseChatModel, logger?: Logger, instanceUrl?: string): BuilderTool;
