import { OperationalError } from '@n8n/errors';
export declare class MaxStalledCountError extends OperationalError {
    constructor(cause: Error);
}
