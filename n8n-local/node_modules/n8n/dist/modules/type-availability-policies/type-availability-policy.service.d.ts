import type { NodeTypeAvailabilityScope } from '@n8n/api-types';
import { EventService } from '@n8n/backend-services';
import { TransactionRunner, type OperationContext } from '@n8n/db';
import { LoadNodesAndCredentials } from '../../load-nodes-and-credentials';
import { NodeTypes } from '../../node-types';
import { TypeAvailabilityPolicyAttachmentRepository } from './database/repositories/type-availability-policy-attachment.repository';
import { TypeAvailabilityPolicyScopeRepository } from './database/repositories/type-availability-policy-scope.repository';
import { TypeAvailabilityPolicyRepository } from './database/repositories/type-availability-policy.repository';
import type { TypeAvailabilityPolicy } from './database/entities/type-availability-policy.entity';
import type { TypeAvailabilityPolicyScope } from './database/entities/type-availability-policy-scope.entity';
import { type EffectivePolicy } from './effective-policy';
import { type ComposedVerdict } from './policy-evaluator';
import type { PolicyAction, PolicyAttachment, PolicyRule } from './policy-rule.types';
import { type PolicyRuleWarning } from './policy-rule-lint';
import { TypeAvailabilityPolicySnapshot } from './type-availability-policy-snapshot';
export type { EffectivePolicy } from './effective-policy';
export type AttachmentInput = {
    readonly policyId: string;
    readonly priority: number;
    readonly isFloor: boolean;
};
export type ScopeAttachments = {
    readonly attachments: readonly PolicyAttachment[];
    readonly version: number;
};
export type ComposedTypeVerdict = ComposedVerdict & {
    readonly name: string;
};
export type ComposedTypeEvaluation = {
    readonly verdicts: ComposedTypeVerdict[];
    readonly versions: Array<{
        scope: NodeTypeAvailabilityScope;
        version: number;
    }>;
};
type PolicyDocumentWrite = {
    readonly policy: TypeAvailabilityPolicy;
    readonly warnings: readonly PolicyRuleWarning[];
};
export declare class TypeAvailabilityPolicyService {
    private readonly policyRepository;
    private readonly scopeRepository;
    private readonly attachmentRepository;
    private readonly transactionRunner;
    private readonly eventService;
    private readonly snapshot;
    private readonly loadNodesAndCredentials;
    private readonly nodeTypes;
    constructor(policyRepository: TypeAvailabilityPolicyRepository, scopeRepository: TypeAvailabilityPolicyScopeRepository, attachmentRepository: TypeAvailabilityPolicyAttachmentRepository, transactionRunner: TransactionRunner, eventService: EventService, snapshot: TypeAvailabilityPolicySnapshot, loadNodesAndCredentials: LoadNodesAndCredentials, nodeTypes: NodeTypes);
    getEffectivePolicy(kind: string, projectId: string | null, ctx?: OperationContext): Promise<EffectivePolicy>;
    setDefaultAction(kind: string, projectId: string | null, defaultAction: PolicyAction, expectedVersion: number, updatedBy: string): Promise<TypeAvailabilityPolicyScope>;
    private createScopeOrConflict;
    private validateAndLintRules;
    createPolicyDocument(kind: string, rules: readonly PolicyRule[], updatedBy: string): Promise<PolicyDocumentWrite>;
    updatePolicyDocument(kind: string, policyId: string, rules: readonly PolicyRule[], expectedVersion: number, updatedBy: string): Promise<PolicyDocumentWrite>;
    deletePolicyDocument(kind: string, policyId: string, updatedBy: string): Promise<void>;
    getPolicyDocument(kind: string, policyId: string): Promise<TypeAvailabilityPolicy | null>;
    listPolicyDocuments(kind: string): Promise<TypeAvailabilityPolicy[]>;
    listPolicyDocumentsPage(kind: string, offset: number, limit: number): Promise<{
        items: TypeAvailabilityPolicy[];
        count: number;
    }>;
    getAttachments(kind: string, scopeId: string, ctx?: OperationContext): Promise<ScopeAttachments>;
    replaceAttachments(kind: string, scopeId: string, attachments: readonly AttachmentInput[], expectedVersion: number, updatedBy: string): Promise<ScopeAttachments>;
    setEffectivePolicy(kind: string, projectId: string | null, input: {
        rules: readonly PolicyRule[];
        defaultAction: PolicyAction;
    }, expectedVersion: number, updatedBy: string): Promise<{
        scopeId: string;
        defaultAction: PolicyAction;
        version: number;
        rules: PolicyRule[];
        warnings: readonly PolicyRuleWarning[];
    }>;
    evaluateComposedType(kind: string, projectId: string, typeName: string): Promise<ComposedVerdict>;
    evaluateComposedTypes(kind: string, projectId: string, typeNames: readonly string[]): Promise<ComposedTypeVerdict[]>;
    evaluateComposedTypesFor(kind: string, projectId: string | null, typeNames: readonly string[]): Promise<ComposedTypeEvaluation>;
    evaluateComposedTypesForAllProjects(kind: string, typeNames: readonly string[]): Promise<{
        withoutProjectPolicy: ComposedTypeVerdict[];
        byProject: Array<{
            projectId: string;
            verdicts: ComposedTypeVerdict[];
        }>;
    }>;
    private verdictComposer;
    private readComposedScopes;
    private readEnforcedScope;
    private readProjectScopes;
}
