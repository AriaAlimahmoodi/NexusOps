"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitNodeSubworkflowRule = void 0;
const decorators_1 = require("@n8n/decorators");
const n8n_workflow_1 = require("n8n-workflow");
let WaitNodeSubworkflowRule = class WaitNodeSubworkflowRule {
    constructor() {
        this.id = 'wait-node-subworkflow-v2';
        this.subWorkflowsWithWaitingNodes = new Map();
        this.parentWorkflowsCalling = [];
        this.waitingNodeConfig = [
            {
                nodeTypes: [
                    'n8n-nodes-base.wait',
                    'n8n-nodes-base.form',
                    '@n8n/n8n-nodes-langchain.chat',
                    'n8n-nodes-base.respondToWebhook',
                ],
            },
            {
                nodeTypes: [
                    'n8n-nodes-base.slack',
                    'n8n-nodes-base.telegram',
                    'n8n-nodes-base.googleChat',
                    'n8n-nodes-base.gmail',
                    'n8n-nodes-base.emailSend',
                    'n8n-nodes-base.whatsApp',
                    'n8n-nodes-base.microsoftTeams',
                    'n8n-nodes-base.microsoftOutlook',
                    'n8n-nodes-base.discord',
                ],
                operation: n8n_workflow_1.SEND_AND_WAIT_OPERATION,
            },
            {
                nodeTypes: ['n8n-nodes-base.github'],
                operation: 'dispatchAndWait',
            },
        ];
    }
    getMetadata() {
        return {
            version: 'v2',
            title: 'Sub-workflow waiting node output behavior change',
            description: 'Parent workflows calling sub-workflows with waiting nodes (Wait, Form, HITL) now receive correct data. Previously, incorrect results were returned when the sub-workflow entered a waiting state.',
            category: "workflow",
            impact: 'behaviorChanges',
            documentationUrl: 'https://docs.n8n.io/2-0-breaking-changes/#return-expected-sub-workflow-data-when-the-sub-workflow-resumes-from-waiting-waiting-for-webhook-for',
        };
    }
    async getRecommendations(_workflowResults) {
        return [
            {
                action: 'Review Execute Workflow node outputs',
                description: 'Check the Execute Workflow nodes flagged above. If your workflow logic depends on the specific data returned from sub-workflows containing waiting nodes, verify the data structure is correct.',
            },
            {
                action: 'Test affected parent workflows',
                description: 'Run the affected parent workflows to verify the data returned from sub-workflows with waiting nodes is now correct and matches your expectations.',
            },
        ];
    }
    reset() {
        this.subWorkflowsWithWaitingNodes.clear();
        this.parentWorkflowsCalling = [];
    }
    async collectWorkflowData(workflow, nodesGroupedByType) {
        const hasExecuteWorkflowTrigger = (nodesGroupedByType.get('n8n-nodes-base.executeWorkflowTrigger')?.length ?? 0) > 0;
        const hasWaitingNodes = this.findWaitingNodes(nodesGroupedByType).length > 0;
        if (hasExecuteWorkflowTrigger && hasWaitingNodes) {
            this.subWorkflowsWithWaitingNodes.set(workflow.id, workflow.name);
        }
        const executeWorkflowNodes = nodesGroupedByType.get('n8n-nodes-base.executeWorkflow') ?? [];
        for (const node of executeWorkflowNodes) {
            const options = node.parameters.options;
            const waitForSubWorkflowValue = options?.waitForSubWorkflow;
            const isExplicitlyFalse = waitForSubWorkflowValue === false;
            if (isExplicitlyFalse) {
                continue;
            }
            const calledWorkflowId = this.extractCalledWorkflowId(node, workflow.id);
            this.parentWorkflowsCalling.push({
                parentWorkflowId: workflow.id,
                executeWorkflowNode: node,
                calledWorkflowId,
            });
        }
    }
    async produceReport() {
        const issuesByParentWorkflow = new Map();
        for (const parent of this.parentWorkflowsCalling) {
            const isUnknownWorkflow = parent.calledWorkflowId === undefined;
            const subWorkflowName = parent.calledWorkflowId !== undefined
                ? this.subWorkflowsWithWaitingNodes.get(parent.calledWorkflowId)
                : undefined;
            const isKnownAffectedWorkflow = subWorkflowName !== undefined;
            if (!isUnknownWorkflow && !isKnownAffectedWorkflow) {
                continue;
            }
            const issue = {
                title: isUnknownWorkflow
                    ? 'Execute Workflow node may call sub-workflow with changed output behavior'
                    : 'Execute Workflow node calls sub-workflow with changed output behavior',
                description: isUnknownWorkflow
                    ? `The "${parent.executeWorkflowNode.name}" node calls a sub-workflow dynamically (via expression or parameter). If the called sub-workflow contains waiting nodes (Wait, Form, Human-in-the-loop), the data returned has changed in v2 - it now returns the correct data instead of the previously incorrect results.`
                    : `The "${parent.executeWorkflowNode.name}" node calls sub-workflow "${subWorkflowName}" (ID: ${parent.calledWorkflowId}) which contains waiting nodes. The data returned from this sub-workflow has changed in v2 - it now returns the correct data instead of the previously incorrect results.`,
                level: 'warning',
                nodeId: parent.executeWorkflowNode.id,
                nodeName: parent.executeWorkflowNode.name,
            };
            const existingIssues = issuesByParentWorkflow.get(parent.parentWorkflowId);
            if (existingIssues) {
                existingIssues.push(issue);
            }
            else {
                issuesByParentWorkflow.set(parent.parentWorkflowId, [issue]);
            }
        }
        const affectedWorkflows = [];
        for (const [workflowId, issues] of issuesByParentWorkflow) {
            affectedWorkflows.push({ workflowId, issues });
        }
        return { affectedWorkflows };
    }
    findWaitingNodes(nodesGroupedByType) {
        const waitingNodes = [];
        for (const { nodeTypes, operation } of this.waitingNodeConfig) {
            for (const nodeType of nodeTypes) {
                const nodes = nodesGroupedByType.get(nodeType) ?? [];
                const matchingNodes = operation
                    ? nodes.filter((node) => node.parameters.operation === operation)
                    : nodes;
                waitingNodes.push(...matchingNodes);
            }
        }
        return waitingNodes;
    }
    extractCalledWorkflowId(node, callerWorkflowId) {
        const source = node.parameters.source;
        if (source !== 'database' && source !== undefined) {
            return undefined;
        }
        const workflowId = node.parameters.workflowId;
        if (typeof workflowId === 'string') {
            if (workflowId.startsWith('=')) {
                return this.isWorkflowItselfExpression(workflowId) ? callerWorkflowId : undefined;
            }
            return workflowId;
        }
        if (typeof workflowId === 'object' && workflowId !== null && 'value' in workflowId) {
            const value = workflowId.value;
            if (typeof value === 'string') {
                if (value.startsWith('=')) {
                    return this.isWorkflowItselfExpression(value) ? callerWorkflowId : undefined;
                }
                return value;
            }
        }
        return undefined;
    }
    isWorkflowItselfExpression(workflowIdExpression) {
        return workflowIdExpression.replace('{{ ', '{{').replace(' }}', '}}') === '={{$workflow.id}}';
    }
};
exports.WaitNodeSubworkflowRule = WaitNodeSubworkflowRule;
exports.WaitNodeSubworkflowRule = WaitNodeSubworkflowRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v2' })
], WaitNodeSubworkflowRule);
//# sourceMappingURL=wait-node-subworkflow.rule.js.map