import { BaseRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import type { PolicyRule } from '../../policy-rule.types';
import { TypeAvailabilityPolicy } from '../entities/type-availability-policy.entity';
type NewPolicy = {
    kind: string;
    rules: readonly PolicyRule[];
    updatedBy: string;
};
export declare class TypeAvailabilityPolicyRepository extends BaseRepository<TypeAvailabilityPolicy> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    private forUpdateLock;
    findByIdAndKind(id: string, kind: string, ctx: OperationContext, forUpdate?: boolean): Promise<TypeAvailabilityPolicy | null>;
    findManyByIds(ids: string[], ctx: OperationContext, forUpdate?: boolean): Promise<TypeAvailabilityPolicy[]>;
    findByKind(kind: string, ctx: OperationContext): Promise<TypeAvailabilityPolicy[]>;
    findPageByKind(kind: string, offset: number, limit: number, ctx: OperationContext): Promise<{
        items: TypeAvailabilityPolicy[];
        count: number;
    }>;
    createPolicy(input: NewPolicy, ctx: OperationContext): Promise<TypeAvailabilityPolicy>;
    updateRules(id: string, rules: readonly PolicyRule[], updatedBy: string, ctx: OperationContext): Promise<TypeAvailabilityPolicy | null>;
    deletePolicy(id: string, ctx: OperationContext): Promise<void>;
}
export {};
