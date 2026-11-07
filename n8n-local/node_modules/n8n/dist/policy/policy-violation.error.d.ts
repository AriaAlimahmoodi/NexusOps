import type { PolicyViolation } from '@n8n/decorators';
import { UserError } from 'n8n-workflow';
export type NonEmptyViolations = [PolicyViolation, ...PolicyViolation[]];
export declare const hasViolations: (violations: PolicyViolation[]) => violations is NonEmptyViolations;
export declare class PolicyViolationError extends UserError {
    readonly violations: PolicyViolation[];
    readonly httpStatusCode = 403;
    readonly errorCode = 403;
    readonly meta: {
        violations: PolicyViolation[];
    };
    readonly isPolicyRefusal = true;
    constructor(violations: NonEmptyViolations, message?: string);
}
export declare function isPolicyRefusal(error: unknown): boolean;
export declare function findPolicyViolations(error: unknown): NonEmptyViolations | undefined;
