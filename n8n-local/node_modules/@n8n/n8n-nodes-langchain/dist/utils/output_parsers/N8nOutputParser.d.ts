import type { IExecuteFunctions, ISupplyDataFunctions, IWebhookFunctions } from 'n8n-workflow';
import { N8nItemListOutputParser } from './N8nItemListOutputParser';
import { N8nOutputFixingParser } from './N8nOutputFixingParser';
import { N8nStructuredOutputParser } from './N8nStructuredOutputParser';
export type N8nOutputParser = N8nOutputFixingParser | N8nStructuredOutputParser | N8nItemListOutputParser;
export { N8nOutputFixingParser, N8nItemListOutputParser, N8nStructuredOutputParser };
export declare function getOptionalOutputParser(ctx: IExecuteFunctions | ISupplyDataFunctions | IWebhookFunctions, index?: number): Promise<N8nOutputParser | undefined>;
