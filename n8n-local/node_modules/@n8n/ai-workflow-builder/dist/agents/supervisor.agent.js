"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupervisorAgent = void 0;
const messages_1 = require("@langchain/core/messages");
const prompts_1 = require("@langchain/core/prompts");
const zod_1 = require("zod");
const prompts_2 = require("../prompts");
const context_builders_1 = require("../utils/context-builders");
const coordination_log_1 = require("../utils/coordination-log");
const ROUTING_OPTIONS_WITH_ASSISTANT = ['responder', 'discovery', 'builder', 'assistant'];
const ROUTING_OPTIONS_WITHOUT_ASSISTANT = ['responder', 'discovery', 'builder'];
function createSupervisorRoutingSchema(mergeAskBuild) {
    return zod_1.z.object({
        reasoning: zod_1.z.string().describe('One sentence explaining why this agent should act next'),
        next: zod_1.z
            .enum(mergeAskBuild ? ROUTING_OPTIONS_WITH_ASSISTANT : ROUTING_OPTIONS_WITHOUT_ASSISTANT)
            .describe('The next agent to call'),
    });
}
class SupervisorAgent {
    llm;
    mergeAskBuild;
    constructor(config) {
        this.llm = config.llm;
        this.mergeAskBuild = config.mergeAskBuild ?? false;
    }
    buildContextMessage(context) {
        const contextParts = [];
        if (context.previousSummary) {
            contextParts.push('<previous_conversation_summary>');
            contextParts.push(context.previousSummary);
            contextParts.push('</previous_conversation_summary>');
        }
        const selectedNodesSummary = (0, context_builders_1.buildSelectedNodesSummary)(context.workflowContext);
        if (selectedNodesSummary) {
            contextParts.push('<selected_nodes>');
            contextParts.push(selectedNodesSummary);
            contextParts.push('</selected_nodes>');
        }
        if (context.workflowJSON.nodes.length > 0) {
            contextParts.push('<workflow_summary>');
            contextParts.push((0, context_builders_1.buildWorkflowSummary)(context.workflowJSON));
            contextParts.push('</workflow_summary>');
        }
        const currentTurnLog = (0, coordination_log_1.getCurrentTurnEntries)(context.coordinationLog);
        if (currentTurnLog.length > 0) {
            contextParts.push('<completed_phases>');
            contextParts.push((0, coordination_log_1.summarizeCoordinationLog)(currentTurnLog));
            contextParts.push('</completed_phases>');
        }
        if (context.workflowContext) {
            contextParts.push((0, context_builders_1.buildSimplifiedExecutionContext)(context.workflowContext, context.workflowJSON.nodes));
        }
        if (contextParts.length === 0) {
            return null;
        }
        return new messages_1.HumanMessage({ content: contextParts.join('\n\n') });
    }
    async invoke(context, config) {
        const promptTemplate = prompts_1.ChatPromptTemplate.fromMessages([
            [
                'system',
                [
                    {
                        type: 'text',
                        text: (0, prompts_2.buildSupervisorPrompt)({ mergeAskBuild: this.mergeAskBuild }),
                        cache_control: { type: 'ephemeral' },
                    },
                ],
            ],
            ['placeholder', '{messages}'],
        ]);
        const routingSchema = createSupervisorRoutingSchema(this.mergeAskBuild);
        const agent = promptTemplate.pipe(this.llm.withStructuredOutput(routingSchema, {
            name: 'routing_decision',
        }));
        const contextMessage = this.buildContextMessage(context);
        const messagesToSend = contextMessage
            ? [...context.messages, contextMessage]
            : context.messages;
        return await agent.invoke({ messages: messagesToSend }, config);
    }
}
exports.SupervisorAgent = SupervisorAgent;
//# sourceMappingURL=supervisor.agent.js.map