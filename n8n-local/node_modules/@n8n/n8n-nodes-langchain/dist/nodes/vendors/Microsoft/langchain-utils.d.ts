import { type IWebhookFunctions } from 'n8n-workflow';
import type { RunnableConfig } from '@langchain/core/runnables';
import type { StructuredToolkit } from 'n8n-core';
export declare function invokeAgent(nodeContext: IWebhookFunctions, input: string, systemMessage?: string, invokeOptions?: RunnableConfig, microsoftMcpToolkits?: StructuredToolkit[]): Promise<string>;
