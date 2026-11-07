import { BaseRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import type { PolicyAction } from '../../policy-rule.types';
import { TypeAvailabilityPolicyScope } from '../entities/type-availability-policy-scope.entity';
type NewPolicyScope = {
    kind: string;
    projectId: string | null;
    defaultAction: PolicyAction;
    updatedBy: string;
};
export type ProjectPolicyScope = TypeAvailabilityPolicyScope & {
    projectId: string;
};
export type ScopeFingerprint = {
    count: number;
    versionSum: number;
    newestCreatedAt: number;
};
export declare class TypeAvailabilityPolicyScopeRepository extends BaseRepository<TypeAvailabilityPolicyScope> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    private forUpdateLock;
    findScopeByKindAndProject(kind: string, projectId: string | null, ctx: OperationContext, forUpdate?: boolean): Promise<TypeAvailabilityPolicyScope | null>;
    findScopeById(id: string, ctx: OperationContext, forUpdate?: boolean): Promise<TypeAvailabilityPolicyScope | null>;
    findScopeByIdAndKind(id: string, kind: string, ctx: OperationContext, forUpdate?: boolean): Promise<TypeAvailabilityPolicyScope | null>;
    lockScopesByIds(ids: string[], ctx: OperationContext): Promise<string[]>;
    findAllScopes(ctx: OperationContext): Promise<TypeAvailabilityPolicyScope[]>;
    readFingerprint(ctx: OperationContext): Promise<ScopeFingerprint>;
    findProjectScopes(kind: string, ctx: OperationContext): Promise<ProjectPolicyScope[]>;
    containsProjectScope(ids: string[], ctx: OperationContext): Promise<boolean>;
    createScopeIfAbsent(input: NewPolicyScope, ctx: OperationContext): Promise<{
        scope: TypeAvailabilityPolicyScope;
        created: boolean;
    }>;
    updateDefaultAction(id: string, defaultAction: PolicyAction, updatedBy: string, ctx: OperationContext): Promise<TypeAvailabilityPolicyScope | null>;
    bumpVersion(id: string, ctx: OperationContext): Promise<void>;
    bumpVersions(ids: string[], ctx: OperationContext): Promise<void>;
}
export {};
