"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAskQuestionsTool = buildAskQuestionsTool;
const tool_1 = require("@n8n/agents/tool");
const api_types_1 = require("@n8n/api-types");
const telemetry_1 = require("@n8n/telemetry");
const nanoid_1 = require("nanoid");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const askQuestionsQuestionSchema = zod_1.z.object({
    id: zod_1.z.string().optional().describe('Unique question identifier; defaults to q1, q2, ...'),
    question: zod_1.z.string().describe('The question text to display to the user'),
    type: zod_1.z
        .enum(['single', 'multi', 'text'])
        .describe('single = pick one option, multi = pick many, text = free-form input'),
    options: zod_1.z
        .array(zod_1.z.string())
        .optional()
        .describe('Suggested answers (required for single/multi, ignored for text)'),
});
const askQuestionsInputSchema = zod_1.z.object({
    questions: zod_1.z
        .array(askQuestionsQuestionSchema)
        .min(1)
        .describe('All questions to ask the user, batched into a single card'),
    introMessage: zod_1.z.string().optional().describe('Brief intro text shown above the questions'),
});
function withDefaultIds(questions) {
    const explicitIds = questions.map((q) => q.id).filter((id) => id !== undefined);
    if (new Set(explicitIds).size !== explicitIds.length) {
        throw new n8n_workflow_1.UserError('agent_builder_ask_questions: question ids must be unique');
    }
    const usedIds = new Set(explicitIds);
    return questions.map((question, index) => {
        if (question.id)
            return { ...question, id: question.id };
        let candidate = index + 1;
        let id = `q${candidate}`;
        while (usedIds.has(id)) {
            candidate++;
            id = `q${candidate}`;
        }
        usedIds.add(id);
        return { ...question, id };
    });
}
function enrichAnswers(answers, questions) {
    return answers.map((answer) => {
        const question = questions.find((q) => q.id === answer.questionId);
        return { ...answer, question: question?.question ?? answer.questionId };
    });
}
function usableAnswers(resumeData) {
    if (resumeData.approved === false)
        return undefined;
    if (!resumeData.answers || resumeData.answers.length === 0)
        return undefined;
    if (resumeData.answers.every((answer) => answer.skipped === true))
        return undefined;
    return resumeData.answers;
}
function buildAskQuestionsTool(deps) {
    return new tool_1.Tool(api_types_1.ASK_QUESTIONS_TOOL_NAME)
        .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(api_types_1.ASK_QUESTIONS_TOOL_NAME))
        .description('Ask the user one or more questions in a single batched card; the run suspends until ' +
        'they respond. ALWAYS use this instead of calling it multiple times when you have more ' +
        'than one question — batch them into one call. Questions are single-select, ' +
        'multi-select, or free-text. A question is asked at most once — a dismissal or empty ' +
        'answer means "proceed without this": assume a sensible default and never re-present ' +
        'it. Returns { answered: false } on dismissal, or { answered: true, answers } otherwise.')
        .input(askQuestionsInputSchema)
        .suspend(api_types_1.questionsSuspendPayloadSchema)
        .resume(api_types_1.questionsResumeSchema)
        .handler(async (input, ctx) => {
        const questions = withDefaultIds(input.questions);
        if (ctx.resumeData === undefined || ctx.resumeData === null) {
            deps.track(telemetry_1.TELEMETRY_EVENT.AGENTS.BUILDER_ASKED_QUESTIONS, {
                question_count: questions.length,
                question_types: [...new Set(questions.map((q) => q.type))].sort(),
            });
            return await ctx.suspend({
                requestId: (0, nanoid_1.nanoid)(),
                message: input.introMessage ?? 'The agent builder has questions',
                severity: 'info',
                inputType: 'questions',
                questions,
                ...(input.introMessage ? { introMessage: input.introMessage } : {}),
            });
        }
        const answers = usableAnswers(ctx.resumeData);
        const rawAnswers = ctx.resumeData.answers ?? [];
        const skippedCount = rawAnswers.filter((answer) => answer.skipped === true).length;
        deps.track(telemetry_1.TELEMETRY_EVENT.AGENTS.USER_ANSWERED_BUILDER_QUESTIONS, {
            outcome: ctx.resumeData.approved === false ? 'dismissed' : answers ? 'answered' : 'skipped',
            answered_count: rawAnswers.length - skippedCount,
            skipped_count: skippedCount,
        });
        if (!answers)
            return { answered: false };
        return { answered: true, answers: enrichAnswers(answers, questions) };
    })
        .build();
}
//# sourceMappingURL=ask-questions.tool.js.map