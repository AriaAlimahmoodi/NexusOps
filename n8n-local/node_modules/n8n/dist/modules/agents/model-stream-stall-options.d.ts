import type { ExecutionOptions } from '@n8n/agents';
import type { AiConfig } from '@n8n/config';
export declare function modelStreamStallOptions(aiConfig: AiConfig): Pick<ExecutionOptions, 'modelStreamIdleTimeoutMs' | 'modelStreamFirstOutputTimeoutMs'>;
