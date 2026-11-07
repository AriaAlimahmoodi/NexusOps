import { type ISupplyDataFunctions } from 'n8n-workflow';
import type { AzureOpenAIOAuth2ModelConfig } from '../types';
export declare function setupOAuth2Authentication(this: ISupplyDataFunctions, credentialName: string): Promise<AzureOpenAIOAuth2ModelConfig>;
