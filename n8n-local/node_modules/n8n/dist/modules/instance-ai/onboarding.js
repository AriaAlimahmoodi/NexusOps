"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceAiOnboardingService = void 0;
exports.startsOnboardingFirstTurn = startsOnboardingFirstTurn;
const di_1 = require("@n8n/di");
const instance_ai_1 = require("@n8n/instance-ai");
const telemetry_1 = require("@n8n/telemetry");
const nanoid_1 = require("nanoid");
const node_crypto_1 = require("node:crypto");
const zod_1 = require("zod");
const errors_1 = require("@n8n/errors");
const telemetry_2 = require("../../telemetry");
const durable_event_log_1 = require("./event-bus/durable-event-log");
const in_process_event_bus_1 = require("./event-bus/in-process-event-bus");
const instance_ai_memory_service_1 = require("./instance-ai-memory.service");
const internal_messages_1 = require("./internal-messages");
const onboarding_opening_1 = require("./onboarding-opening");
const instance_ai_pending_confirmation_repository_1 = require("./repositories/instance-ai-pending-confirmation.repository");
const CARD_REQUEST_ID_PREFIX = 'onboarding-';
const surveySchema = zod_1.z.object({ what_team_are_you_on: zod_1.z.string().max(100).optional() });
const surveySourceSchema = zod_1.z.enum(['cloud', 'url']);
const launchContextSchema = zod_1.z.object({
    survey: surveySchema.optional(),
    surveySource: surveySourceSchema.optional(),
});
const SURVEY_KEY_BY_QUESTION = {
    team: 'what_team_are_you_on',
};
function hasFreeText(request) {
    return (request.kind === 'questions' && request.answers.some((answer) => answer.customText?.trim()));
}
function startsOnboardingFirstTurn(requestId, request) {
    return requestId.startsWith(CARD_REQUEST_ID_PREFIX) && hasFreeText(request);
}
function surveyOf(sourceContext) {
    const parsed = launchContextSchema.safeParse(sourceContext ?? {});
    if (!parsed.success)
        throw new errors_1.BadRequestError('Invalid onboarding survey in sourceContext');
    return { survey: parsed.data.survey ?? {}, surveySource: parsed.data.surveySource ?? null };
}
function applySurvey(questions, survey) {
    const answered = new Map();
    for (const question of questions) {
        const key = SURVEY_KEY_BY_QUESTION[question.id];
        const value = key && survey[key]?.trim();
        if (value)
            answered.set(question.id, value);
    }
    const known = (id) => {
        const value = answered.get(id);
        return value && questions.find((question) => question.id === id)?.options?.includes(value)
            ? value
            : '';
    };
    const fill = (text) => text.replace(/\{\{(\w+)\}\}/g, (_, id) => known(id)).replace(/ {2,}/g, ' ');
    const filled = questions.map((question) => ({ ...question, question: fill(question.question) }));
    const shown = filled.flatMap((question) => {
        if (answered.has(question.id))
            return [];
        const dependency = question.optionsByAnswer;
        if (!dependency || !answered.has(dependency.questionId))
            return [question];
        return [
            {
                ...question,
                options: dependency.options[known(dependency.questionId)] ?? question.options,
                optionsByAnswer: undefined,
            },
        ];
    });
    return { questions: filled, shown, answered };
}
function mentionApps(apps) {
    if (apps.length === 0)
        return 'your tools';
    if (apps.length <= 2)
        return apps.join(' and ');
    return `${apps[0]}, ${apps[1]}, and your other tools`;
}
let InstanceAiOnboardingService = class InstanceAiOnboardingService {
    constructor(memoryService, eventBus, eventLog, pendingConfirmationRepo, telemetry) {
        this.memoryService = memoryService;
        this.eventBus = eventBus;
        this.eventLog = eventLog;
        this.pendingConfirmationRepo = pendingConfirmationRepo;
        this.telemetry = telemetry;
    }
    async ensureThread(user, threadId, projectId, launchMetadata) {
        const { survey, surveySource } = surveyOf(launchMetadata.sourceContext);
        const { shown } = applySurvey(onboarding_opening_1.ONBOARDING_OPENING.questions, survey);
        const response = await this.memoryService.ensureThread(user.id, threadId, projectId, launchMetadata, onboarding_opening_1.ONBOARDING_OPENING.title);
        if (!response.created)
            return response;
        const greeting = onboarding_opening_1.ONBOARDING_OPENING.greeting.replace('{{firstName}}', user.firstName?.trim() || 'there');
        try {
            const { userMessageId } = await this.memoryService.seedOpeningMessages(threadId, user.id, greeting);
            await this.seedTurn({
                threadId,
                userId: user.id,
                messageId: userMessageId,
                text: greeting,
                card: { title: onboarding_opening_1.ONBOARDING_OPENING.title, questions: shown },
            });
        }
        catch (error) {
            await this.memoryService.deleteThread(threadId);
            throw error;
        }
        const team = survey.what_team_are_you_on?.trim() || null;
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.INSTANCE_AI.USER_STARTED_AI_ASSISTANT_ONBOARDING, {
            user_id: user.id,
            thread_id: threadId,
            team,
            team_source: team ? surveySource : null,
        });
        return response;
    }
    async answerCard(userId, requestId, request) {
        if (!requestId.startsWith(CARD_REQUEST_ID_PREFIX))
            return undefined;
        if (request.kind !== 'questions') {
            throw new errors_1.BadRequestError('The onboarding card takes answers of kind "questions"');
        }
        const row = await this.pendingConfirmationRepo.claim(requestId, userId);
        if (!row?.toolCallId)
            return undefined;
        const metadata = await this.memoryService.getThreadMetadata(userId, row.threadId);
        const { survey, surveySource } = surveyOf(metadata?.sourceContext);
        const { questions, shown, answered } = applySurvey(onboarding_opening_1.ONBOARDING_OPENING.questions, survey);
        const given = request.answers;
        const answerFor = (question) => ({
            ...(given.find((answer) => answer.questionId === question.id) ?? {
                questionId: question.id,
                selectedOptions: [],
                skipped: true,
            }),
            question: question.question,
        });
        const answers = shown.map(answerFor);
        this.eventBus.publish(row.threadId, {
            type: 'tool-result',
            runId: row.runId,
            agentId: (0, instance_ai_1.orchestratorAgentId)(row.runId),
            payload: { toolCallId: row.toolCallId, result: { answered: true, answers } },
        });
        await this.eventLog.flush(row.threadId);
        const picked = (id) => {
            const fromSurvey = answered.get(id);
            if (fromSurvey)
                return [fromSurvey];
            return given.find((answer) => answer.questionId === id)?.selectedOptions ?? [];
        };
        const team = picked('team')[0] ?? null;
        const teamSource = answered.has('team') ? surveySource : team ? 'card' : null;
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.INSTANCE_AI.USER_ANSWERED_AI_ASSISTANT_ONBOARDING_CARD, {
            user_id: userId,
            thread_id: row.threadId,
            team,
            team_source: teamSource,
            apps: picked('apps'),
            custom_text: (0, telemetry_1.redactTelemetryText)(given
                .map((answer) => answer.customText?.trim())
                .filter(Boolean)
                .join('\n')) || null,
        });
        const lines = questions.map((question) => {
            const fromSurvey = answered.get(question.id);
            return fromSurvey
                ? { question: question.question, selectedOptions: [fromSurvey] }
                : answerFor(question);
        });
        const answerMessage = (0, internal_messages_1.buildOnboardingAnswerMessage)(lines);
        if (hasFreeText(request)) {
            return { threadId: row.threadId, firstMessage: answerMessage };
        }
        const apps = answers.find((answer) => answer.questionId === 'apps')?.selectedOptions ?? [];
        const followUp = onboarding_opening_1.ONBOARDING_OPENING.followUp.replace('{{apps}}', mentionApps(apps));
        const { userMessageId } = await this.memoryService.seedOpeningMessages(row.threadId, userId, followUp, answerMessage);
        const runId = await this.seedTurn({
            threadId: row.threadId,
            userId,
            messageId: userMessageId,
            text: followUp,
        });
        return { threadId: row.threadId, runId };
    }
    async seedTurn(turn) {
        const { threadId, card } = turn;
        const runId = (0, node_crypto_1.randomUUID)();
        const messageGroupId = `mg_${(0, nanoid_1.nanoid)()}`;
        const agentId = (0, instance_ai_1.orchestratorAgentId)(runId);
        const events = [
            {
                type: 'run-start',
                runId,
                agentId,
                payload: { messageId: turn.messageId, messageGroupId },
            },
            { type: 'text-delta', runId, agentId, responseId: (0, nanoid_1.nanoid)(), payload: { text: turn.text } },
        ];
        const toolCallId = (0, nanoid_1.nanoid)();
        const requestId = `${CARD_REQUEST_ID_PREFIX}${(0, nanoid_1.nanoid)()}`;
        if (card) {
            const args = { questions: card.questions };
            events.push({
                type: 'tool-call',
                runId,
                agentId,
                payload: { toolCallId, toolName: instance_ai_1.ASK_USER_TOOL_ID, args },
            }, {
                type: 'confirmation-request',
                runId,
                agentId,
                payload: {
                    requestId,
                    toolCallId,
                    toolName: instance_ai_1.ASK_USER_TOOL_ID,
                    args,
                    severity: 'info',
                    message: card.title,
                    inputType: 'questions',
                    questions: card.questions,
                },
            });
        }
        events.push({ type: 'run-finish', runId, agentId, payload: { status: 'completed' } });
        if (card) {
            await this.pendingConfirmationRepo.save(this.pendingConfirmationRepo.create({
                requestId,
                threadId,
                userId: turn.userId,
                kind: 'inline',
                runId,
                messageGroupId,
                toolCallId,
                expiresAt: null,
            }));
        }
        for (const event of events)
            this.eventBus.publish(threadId, event);
        await this.eventLog.flush(threadId);
        return runId;
    }
};
exports.InstanceAiOnboardingService = InstanceAiOnboardingService;
exports.InstanceAiOnboardingService = InstanceAiOnboardingService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [instance_ai_memory_service_1.InstanceAiMemoryService, in_process_event_bus_1.InProcessEventBus, durable_event_log_1.DurableEventLog, instance_ai_pending_confirmation_repository_1.InstanceAiPendingConfirmationRepository, telemetry_2.Telemetry])
], InstanceAiOnboardingService);
//# sourceMappingURL=onboarding.js.map