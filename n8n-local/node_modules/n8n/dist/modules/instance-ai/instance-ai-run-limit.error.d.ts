import type { InstanceAiRunLimitMeta } from '@n8n/api-types';
import { TooManyRequestsError } from '@n8n/errors';
export declare class InstanceAiRunLimitError extends TooManyRequestsError {
    readonly meta: InstanceAiRunLimitMeta;
    constructor(message: string, meta: InstanceAiRunLimitMeta);
}
