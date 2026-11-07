import { UserError } from 'n8n-workflow';
export type PromotionConflictKind = 'instance-connection' | 'config-direction' | 'project-link' | 'provider-in-use';
export declare class PromotionConflictError extends UserError {
    readonly kind: PromotionConflictKind;
    constructor(kind: PromotionConflictKind, message: string);
}
