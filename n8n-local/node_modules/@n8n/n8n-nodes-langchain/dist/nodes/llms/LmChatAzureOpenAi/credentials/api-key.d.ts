import { type ISupplyDataFunctions } from 'n8n-workflow';
import type { AzureOpenAIApiKeyModelConfig } from '../types';
export declare function setupApiKeyAuthentication(this: ISupplyDataFunctions, credentialName: string): Promise<AzureOpenAIApiKeyModelConfig>;
