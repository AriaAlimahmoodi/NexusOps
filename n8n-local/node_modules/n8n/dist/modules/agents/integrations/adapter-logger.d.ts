import type { Logger } from '@n8n/backend-common';
import type { Logger as ChatLogger } from 'chat';
export declare function createAdapterLogger(logger: Logger, prefix: string): ChatLogger;
