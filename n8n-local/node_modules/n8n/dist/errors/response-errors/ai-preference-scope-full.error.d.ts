import type { AiPreferenceScope } from '@n8n/api-types';
import { BadRequestError } from '@n8n/errors';
export declare class AiPreferenceScopeFullError extends BadRequestError {
    readonly meta: {
        limit: number;
        actual: number;
    };
    constructor(scope: AiPreferenceScope, meta: {
        limit: number;
        actual: number;
    });
}
