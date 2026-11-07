"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitQuestionsTool = void 0;
exports.formatAnswersForDiscovery = formatAnswersForDiscovery;
const tools_1 = require("@langchain/core/tools");
const langgraph_1 = require("@langchain/langgraph");
const zod_1 = require("zod");
const plannerQuestionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    question: zod_1.z.string(),
    type: zod_1.z.enum(['single', 'multi', 'text']),
    options: zod_1.z.array(zod_1.z.string()).optional(),
});
const submitQuestionsInputSchema = zod_1.z.object({
    introMessage: zod_1.z.string().optional().describe('Brief context for why asking'),
    questions: zod_1.z.array(plannerQuestionSchema).min(1).max(5),
});
const questionResponseSchema = zod_1.z.object({
    questionId: zod_1.z.string(),
    question: zod_1.z.string(),
    selectedOptions: zod_1.z.array(zod_1.z.string()),
    customText: zod_1.z.string().optional(),
    skipped: zod_1.z.boolean().optional(),
});
const answersArraySchema = zod_1.z.array(questionResponseSchema);
const answersRecordSchema = zod_1.z.record(zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]));
function formatAnswersForDiscovery(questions, resumeValue) {
    const parsedArray = answersArraySchema.safeParse(resumeValue);
    if (parsedArray.success) {
        const lines = parsedArray.data
            .filter((a) => !a.skipped)
            .map((a) => {
            const selected = a.selectedOptions.join(', ').trim();
            const custom = a.customText?.trim();
            const parts = [selected, custom].filter((part) => typeof part === 'string' && part.length > 0);
            const answerText = parts.length > 0 ? parts.join(', ') : '(no answer)';
            return `- ${a.question}: ${answerText}`;
        });
        return `User provided these clarifications:\n${lines.join('\n')}\n\nProceed with node discovery based on this information.`;
    }
    const parsedRecord = answersRecordSchema.safeParse(resumeValue);
    if (parsedRecord.success) {
        const lines = questions
            .map((q) => {
            const answer = parsedRecord.data[q.id];
            if (!answer)
                return null;
            const answerText = Array.isArray(answer) ? answer.join(', ') : answer;
            return `- ${q.question}: ${answerText}`;
        })
            .filter((line) => typeof line === 'string');
        return `User provided these clarifications:\n${lines.join('\n')}\n\nProceed with node discovery based on this information.`;
    }
    return 'User responded, but the answer payload could not be parsed. Ask the questions again with simpler options.';
}
exports.submitQuestionsTool = (0, tools_1.tool)(async (input) => {
    const resumeValue = (0, langgraph_1.interrupt)({
        type: 'questions',
        introMessage: input.introMessage,
        questions: input.questions,
    });
    return formatAnswersForDiscovery(input.questions, resumeValue);
}, {
    name: 'submit_questions',
    description: `Ask clarifying questions before proceeding with node discovery. Use when:
- The request is ambiguous or has multiple interpretations
- Key information is missing (which service, what goal, what trigger, etc.)
- You would need to make assumptions the user might disagree with

Maximum 5 questions. Provide options where possible.
IMPORTANT: Never include "Other" as an option — the UI automatically adds an "Other" free-text input to every question. Only include specific, meaningful options.`,
    schema: submitQuestionsInputSchema,
});
//# sourceMappingURL=submit-questions.tool.js.map