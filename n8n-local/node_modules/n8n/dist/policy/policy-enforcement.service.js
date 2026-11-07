"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyEnforcementService = void 0;
const decorators_1 = require("@n8n/decorators");
const policy_internal_1 = require("@n8n/decorators/policy-internal");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const policed_agent_nodes_1 = require("./policed-agent-nodes");
const policy_violation_error_1 = require("./policy-violation.error");
const emptyDecision = () => ({ violations: [] });
function expanded(workflow) {
    const nodes = (0, policed_agent_nodes_1.withInlineAgentToolNodes)(workflow.nodes);
    return nodes === workflow.nodes ? workflow : { ...workflow, nodes };
}
function expandedSave(context) {
    const { workflow, storedWorkflow } = context;
    return {
        ...context,
        workflow: expanded(workflow),
        storedWorkflow: storedWorkflow === null ? null : expanded(storedWorkflow),
    };
}
function expandedWorkflow(context) {
    return { ...context, workflow: expanded(context.workflow) };
}
function expandedImport(context) {
    return 'workflow' in context ? expandedWorkflow(context) : context;
}
let PolicyEnforcementService = class PolicyEnforcementService {
    setImplementation(implementation) {
        if (this.implementation) {
            throw new n8n_workflow_1.UnexpectedError('A policy enforcement implementation is already registered');
        }
        this.implementation = implementation;
    }
    hasChecksFor(point) {
        return this.implementation?.hasChecksFor(point) ?? false;
    }
    async enforceWorkflowSave(context, actor) {
        const subject = context.storedWorkflow === null
            ? (0, decorators_1.workflowContentSubject)(context.workflow)
            : (0, decorators_1.workflowSubject)(context.workflow);
        return await this.enforce('workflowSave', expandedSave(context), actor, subject);
    }
    async evaluateWorkflowSave(context) {
        return await this.evaluate('workflowSave', expandedSave(context));
    }
    async enforceWorkflowPublish(context, actor) {
        return await this.enforce('workflowPublish', expandedWorkflow(context), actor, (0, decorators_1.workflowSubject)(context.workflow));
    }
    async evaluateWorkflowPublish(context) {
        return await this.evaluate('workflowPublish', expandedWorkflow(context));
    }
    async enforceWorkflowStart(context, actor) {
        return await this.enforce('workflowStart', expandedWorkflow(context), actor, (0, decorators_1.workflowSubject)(context.workflow));
    }
    async evaluateWorkflowStart(context) {
        return await this.evaluate('workflowStart', expandedWorkflow(context));
    }
    async enforceWorkflowTransfer(context, actor) {
        return await this.enforce('workflowTransfer', expandedWorkflow(context), actor, (0, decorators_1.workflowSubject)(context.workflow));
    }
    async evaluateWorkflowTransfer(context) {
        return await this.evaluate('workflowTransfer', expandedWorkflow(context));
    }
    async enforceCredentialSave(context, actor) {
        const subject = context.storedCredential === null
            ? (0, decorators_1.credentialContentSubject)(context.credential)
            : (0, decorators_1.credentialSubject)(context.credential);
        return await this.enforce('credentialSave', context, actor, subject);
    }
    async evaluateCredentialSave(context) {
        return await this.evaluate('credentialSave', context);
    }
    async enforceCredentialTransfer(context, actor) {
        return await this.enforce('credentialTransfer', context, actor, (0, decorators_1.credentialSubject)(context.credential));
    }
    async evaluateCredentialTransfer(context) {
        return await this.evaluate('credentialTransfer', context);
    }
    async enforceCredentialDecrypt(context, actor) {
        return await this.enforce('credentialDecrypt', context, actor, {
            type: 'credential',
            id: context.credentialId,
        });
    }
    async evaluateCredentialDecrypt(context) {
        return await this.evaluate('credentialDecrypt', context);
    }
    async enforceContentImport(context, actor) {
        const subject = 'workflow' in context
            ? (0, decorators_1.workflowSubject)(context.workflow)
            : (0, decorators_1.credentialSubject)(context.credential);
        return await this.enforce('contentImport', expandedImport(context), actor, subject);
    }
    async evaluateContentImport(context) {
        return await this.evaluate('contentImport', expandedImport(context));
    }
    async enforce(point, context, actor, subject) {
        const decision = this.implementation
            ? await this.implementation.enforce(point, context, actor)
            : emptyDecision();
        if ((0, policy_violation_error_1.hasViolations)(decision.violations)) {
            throw new policy_violation_error_1.PolicyViolationError(decision.violations);
        }
        return (0, policy_internal_1.mintPolicyCleared)({ point, subject, decision });
    }
    async evaluate(point, context) {
        if (!this.implementation)
            return emptyDecision();
        return await this.implementation.evaluate(point, context);
    }
};
exports.PolicyEnforcementService = PolicyEnforcementService;
exports.PolicyEnforcementService = PolicyEnforcementService = __decorate([
    (0, di_1.Service)()
], PolicyEnforcementService);
//# sourceMappingURL=policy-enforcement.service.js.map