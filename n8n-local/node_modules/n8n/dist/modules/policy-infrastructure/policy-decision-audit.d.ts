import type { EnforcementPoint, PolicyCheckFailure, PolicyDecision, PolicyViolation, PolicyVersionRef } from '@n8n/decorators';
import type { UserLike } from '../../types/user-like.types';
import type { PolicyActor, PolicyContext, PolicySystemReason } from '../../policy/policy-enforcement-backend';
type AnyPolicyContext = PolicyContext<EnforcementPoint>;
type OptionalAuditedKey = 'subject' | 'subjectType' | 'scope' | 'matchedRuleId';
type AuditedViolation = Pick<PolicyViolation, 'checkId' | 'kind'> & {
    [Key in OptionalAuditedKey]-?: Exclude<PolicyViolation[Key], undefined> | null;
};
export type PolicyDecisionAudit = {
    point: EnforcementPoint;
    outcome: 'violation' | 'checkFailure';
    durationMs: number;
    checkIds: string[];
    violations: AuditedViolation[];
    policyVersions?: PolicyVersionRef[];
    correlationIds?: string[];
    workflowId?: string | null;
    workflowName?: string;
    agentId?: string | null;
    agentName?: string;
    credentialId?: string | null;
    credentialType?: string;
    consumerNodeType?: string;
    projectId: string | null;
};
export type DecisionAuditInput = {
    point: EnforcementPoint;
    context: AnyPolicyContext;
    decision: PolicyDecision;
    durationMs: number;
    checkIds: string[];
    failures?: PolicyCheckFailure[];
};
export declare function decisionAudit({ point, context, decision, durationMs, checkIds, failures, }: DecisionAuditInput): PolicyDecisionAudit;
export type AuditedActor = {
    actorType: 'user';
    user: UserLike;
} | {
    actorType: 'system';
    user: null;
    systemReason: PolicySystemReason;
    executionId?: string;
};
export declare function auditedActor(actor: PolicyActor): AuditedActor;
export {};
