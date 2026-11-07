"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decisionAudit = decisionAudit;
exports.auditedActor = auditedActor;
const auditedViolation = (violation) => ({
    checkId: violation.checkId,
    kind: violation.kind,
    subject: violation.subject ?? null,
    subjectType: violation.subjectType ?? null,
    scope: violation.scope ?? null,
    matchedRuleId: violation.matchedRuleId ?? null,
});
const policedWorkflowId = (context) => ('storedWorkflow' in context ? (context.storedWorkflow?.id ?? null) : context.workflow.id);
function targetOf(context) {
    if ('storedCredential' in context) {
        return {
            credentialId: context.storedCredential?.id ?? null,
            credentialType: context.credential.type,
            projectId: context.projectId,
        };
    }
    if ('credentialId' in context) {
        return {
            credentialId: context.credentialId,
            credentialType: context.credentialType,
            consumerNodeType: context.consumer?.nodeType,
            projectId: context.projectId,
        };
    }
    if ('credential' in context && 'targetProjectId' in context) {
        return {
            credentialId: context.credential.id,
            credentialType: context.credential.type,
            projectId: context.targetProjectId,
        };
    }
    if ('credential' in context) {
        return {
            credentialId: context.credential.id,
            credentialType: context.credential.type,
            projectId: context.projectId,
        };
    }
    const projectId = 'targetProjectId' in context ? context.targetProjectId : context.projectId;
    if (context.workflow.artifactKind === 'agent') {
        return { agentId: policedWorkflowId(context), agentName: context.workflow.name, projectId };
    }
    return {
        workflowId: policedWorkflowId(context),
        workflowName: context.workflow.name,
        projectId,
    };
}
function decisionAudit({ point, context, decision, durationMs, checkIds, failures = [], }) {
    return {
        point,
        outcome: failures.length > 0 ? 'checkFailure' : 'violation',
        durationMs,
        checkIds,
        violations: decision.violations.map(auditedViolation),
        policyVersions: decision.policyVersions,
        ...(failures.length > 0 && {
            correlationIds: failures.map((failure) => failure.correlationId),
        }),
        ...targetOf(context),
    };
}
function auditedActor(actor) {
    if (actor.kind === 'user')
        return { actorType: 'user', user: actor.user };
    return {
        actorType: 'system',
        user: null,
        systemReason: actor.reason,
        ...(actor.executionId !== undefined && { executionId: actor.executionId }),
    };
}
//# sourceMappingURL=policy-decision-audit.js.map