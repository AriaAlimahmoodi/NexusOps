import { BaseRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import type { PolicyAttachment } from '../../policy-rule.types';
import { TypeAvailabilityPolicyAttachment } from '../entities/type-availability-policy-attachment.entity';
type AttachmentSlot = {
    policyId: string;
    priority: number;
    isFloor: boolean;
};
export declare class TypeAvailabilityPolicyAttachmentRepository extends BaseRepository<TypeAvailabilityPolicyAttachment> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    listAttachmentsForScope(scopeId: string, ctx: OperationContext): Promise<PolicyAttachment[]>;
    listAttachmentsForScopes(scopeIds: string[], ctx: OperationContext): Promise<Map<string, PolicyAttachment[]>>;
    replaceAttachmentsForScope(scopeId: string, attachments: readonly AttachmentSlot[], ctx: OperationContext): Promise<void>;
    private assertAttachableToScope;
    listScopeIdsAttachedToPolicy(policyId: string, ctx: OperationContext): Promise<string[]>;
}
export {};
