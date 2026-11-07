"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plannerOutputSchema = void 0;
exports.createPlannerAgent = createPlannerAgent;
exports.parsePlanDecision = parsePlanDecision;
exports.invokePlannerNode = invokePlannerNode;
const messages_1 = require("@langchain/core/messages");
const langgraph_1 = require("@langchain/langgraph");
const langchain_1 = require("langchain");
const zod_1 = require("zod");
const prompts_1 = require("../prompts");
const context_builders_1 = require("../utils/context-builders");
const plan_helpers_1 = require("../utils/plan-helpers");
exports.plannerOutputSchema = zod_1.z.object({
    summary: zod_1.z.string().describe('1-2 sentence description of the workflow outcome'),
    trigger: zod_1.z.string().describe('What starts the workflow (manual, schedule, webhook, etc.)'),
    steps: zod_1.z
        .array(zod_1.z.object({
        description: zod_1.z.string().describe('What this step does'),
        subSteps: zod_1.z.array(zod_1.z.string()).optional(),
        suggestedNodes: zod_1.z
            .array(zod_1.z.string())
            .optional()
            .describe('Copy exact node type names from discovery_context_suggested_nodes. Do not modify, prefix, or invent names.'),
    }))
        .min(1)
        .describe('Ordered list of workflow steps'),
    additionalSpecs: zod_1.z
        .array(zod_1.z.string())
        .optional()
        .describe('Optional assumptions, edge cases, or notes'),
});
function createPlannerAgent(config) {
    const tools = config.tools ?? [];
    const hasDocumentationTool = tools.some((t) => t.name === 'get_documentation');
    const plannerPromptText = (0, prompts_1.buildPlannerPrompt)({ hasDocumentationTool });
    const systemPrompt = new messages_1.SystemMessage({
        content: [
            {
                type: 'text',
                text: plannerPromptText,
                cache_control: { type: 'ephemeral' },
            },
        ],
    });
    return (0, langchain_1.createAgent)({
        model: config.llm,
        tools,
        systemPrompt,
        responseFormat: exports.plannerOutputSchema,
    });
}
function parsePlanDecision(value) {
    if (typeof value !== 'object' || value === null) {
        return {
            action: 'reject',
            feedback: `Invalid response: expected an object, got ${typeof value}.`,
        };
    }
    const obj = value;
    const action = obj.action;
    if (action !== 'approve' && action !== 'reject' && action !== 'modify') {
        return {
            action: 'reject',
            feedback: `Invalid response: expected action to be approve/reject/modify, got '${String(action)}'.`,
        };
    }
    const feedback = typeof obj.feedback === 'string' ? obj.feedback : undefined;
    return { action, ...(feedback ? { feedback } : {}) };
}
const MAX_PLANNER_RETRIES = 1;
async function invokePlannerNode(agent, input, config) {
    const contextContent = (0, prompts_1.buildPlannerContext)({
        userRequest: input.userRequest,
        discoveryContext: input.discoveryContext,
        workflowJSON: input.workflowJSON,
        planPrevious: input.planPrevious,
        planFeedback: input.planFeedback,
        selectedNodesContext: input.selectedNodesContext,
    });
    const contextMessage = (0, context_builders_1.createContextMessage)([contextContent]);
    let lastError;
    let plan;
    for (let attempt = 0; attempt <= MAX_PLANNER_RETRIES; attempt++) {
        const messages = attempt === 0
            ? [contextMessage]
            : [
                contextMessage,
                new messages_1.HumanMessage(`Your previous output was invalid: ${lastError}. Please output a valid JSON plan with summary, trigger, and steps fields.`),
            ];
        const output = await agent.invoke({ messages }, config);
        const parsedPlan = exports.plannerOutputSchema.safeParse(output.structuredResponse);
        if (parsedPlan.success) {
            plan = parsedPlan.data;
            break;
        }
        lastError = parsedPlan.error.message;
    }
    if (!plan) {
        throw new Error(`Planner produced invalid output after ${MAX_PLANNER_RETRIES + 1} attempts: ${lastError}`);
    }
    const decisionValue = (0, langgraph_1.interrupt)({ type: 'plan', plan });
    const decision = parsePlanDecision(decisionValue);
    if (decision.action === 'approve') {
        return {
            planDecision: 'approve',
            planOutput: plan,
            mode: 'build',
            planFeedback: null,
            planPrevious: null,
        };
    }
    if (decision.action === 'reject') {
        return {
            planDecision: 'reject',
            planOutput: null,
            planFeedback: null,
            planPrevious: null,
        };
    }
    const feedback = decision.feedback ?? 'User requested changes without additional details.';
    const feedbackMessage = (0, context_builders_1.createContextMessage)([
        `<plan_feedback>\n${feedback}\n</plan_feedback>`,
        `<previous_plan>\n${(0, plan_helpers_1.formatPlanAsText)(plan)}\n</previous_plan>`,
    ]);
    return {
        planDecision: 'modify',
        planOutput: null,
        planFeedback: feedback,
        planPrevious: plan,
        messages: [feedbackMessage],
    };
}
//# sourceMappingURL=planner.agent.js.map