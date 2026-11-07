import type { LICENSE_FEATURES } from '@n8n/constants';
import { UserError } from '@n8n/errors';
export declare class FeatureNotLicensedError extends UserError {
    constructor(feature: (typeof LICENSE_FEATURES)[keyof typeof LICENSE_FEATURES], opts?: {
        extra?: Record<string, unknown>;
    });
}
