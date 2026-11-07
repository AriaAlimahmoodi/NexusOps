import type { EnforcementPoint } from '@n8n/decorators';
import { OperationalError } from 'n8n-workflow';
export declare class PolicyCheckFailedError extends OperationalError {
    readonly httpStatusCode = 503;
    readonly errorCode = 503;
    readonly meta: {
        correlationIds: string[];
    };
    constructor(point: EnforcementPoint, correlationIds: string[]);
}
