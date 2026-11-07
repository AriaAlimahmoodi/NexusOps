import type { PolicyViolation } from '@n8n/decorators';
import type { ComposedTypeVerdict } from './type-availability-policy.service';
export type TypeViolationSubject = {
    readonly kind: string;
    readonly subjectType: string;
    readonly label: string;
};
export declare const NODE_TYPE_SUBJECT: TypeViolationSubject;
export declare const CREDENTIAL_TYPE_SUBJECT: TypeViolationSubject;
export declare function toTypeViolation(checkId: string, subject: TypeViolationSubject, verdict: ComposedTypeVerdict, projectId: string | null): PolicyViolation;
