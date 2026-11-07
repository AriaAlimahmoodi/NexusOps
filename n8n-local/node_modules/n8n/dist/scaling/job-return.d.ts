import type { Logger } from '@n8n/backend-common';
import type { Job } from './scaling.types';
export declare function throwJobBackToQueue(job: Job, logger: Logger): Promise<never>;
