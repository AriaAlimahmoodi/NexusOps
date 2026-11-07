"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFinishSetupTool = buildFinishSetupTool;
const tool_1 = require("@n8n/agents/tool");
const api_types_1 = require("@n8n/api-types");
const telemetry_1 = require("@n8n/telemetry");
const nanoid_1 = require("nanoid");
const zod_1 = require("zod");
const builder_tool_names_1 = require("../builder-tool-names");
function credentialsOfType(all, credentialType) {
    return all.filter((c) => c.type === credentialType).map((c) => ({ id: c.id, name: c.name }));
}
async function credentialNameById(credentialService, credentialId) {
    try {
        const credential = await credentialService.get(credentialId);
        return credential.name;
    }
    catch {
        return credentialId;
    }
}
const finishSetupQuestionInputSchema = api_types_1.interactionQuestionSchema.extend({
    configPath: zod_1.z
        .string()
        .startsWith('/')
        .optional()
        .describe('JSON Pointer into the agent config, e.g. "/tools/2/node/nodeParameters/sendTo". ' +
        'The answer is written there as a string when the flow completes.'),
});
const finishSetupCredentialRequestInputSchema = zod_1.z.object({
    credentialType: zod_1.z.string().min(1),
    purpose: zod_1.z.string().min(1),
    credentialSlot: zod_1.z.string().optional(),
});
const finishSetupChannelInputSchema = zod_1.z.object({
    integrationType: zod_1.z.string().min(1),
});
const finishSetupInputSchema = zod_1.z
    .object({
    questions: zod_1.z.array(finishSetupQuestionInputSchema).optional(),
    credentialRequests: zod_1.z.array(finishSetupCredentialRequestInputSchema).optional(),
    channels: zod_1.z.array(finishSetupChannelInputSchema).optional(),
})
    .refine((v) => (v.questions?.length ?? 0) + (v.credentialRequests?.length ?? 0) + (v.channels?.length ?? 0) >
    0, { message: 'Pass at least one pending setup item.' });
const credentialOutcomeSchema = zod_1.z.union([
    zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() }),
    zod_1.z.literal('skipped'),
]);
const channelOutcomeSchema = zod_1.z.union([zod_1.z.literal('configured'), zod_1.z.literal('skipped')]);
const questionsPhaseSchema = zod_1.z.object({ kind: zod_1.z.literal('questions') });
const credentialsPhaseSchema = zod_1.z.object({
    kind: zod_1.z.literal('credentials'),
    slots: zod_1.z.array(finishSetupCredentialRequestInputSchema),
});
const channelPhaseSchema = zod_1.z.object({
    kind: zod_1.z.literal('channel'),
    integrationType: zod_1.z.string(),
});
const phaseDescriptorSchema = zod_1.z.union([
    questionsPhaseSchema,
    credentialsPhaseSchema,
    channelPhaseSchema,
]);
const collectedSchema = zod_1.z.object({
    answers: zod_1.z.array(api_types_1.questionAnswerSchema).optional(),
    credentials: zod_1.z.record(credentialOutcomeSchema).optional(),
    channels: zod_1.z.record(channelOutcomeSchema).optional(),
});
const checkpointCollectedSchema = collectedSchema.extend({
    channels: zod_1.z.record(zod_1.z.union([channelOutcomeSchema, zod_1.z.literal('connected')])).optional(),
});
const chainStateSchema = zod_1.z.object({
    currentPhase: phaseDescriptorSchema,
    remainingPhases: zod_1.z.array(phaseDescriptorSchema),
    collected: checkpointCollectedSchema,
    totalPhases: zod_1.z.number(),
});
const finishSetupSuspendSchema = zod_1.z.union([
    api_types_1.questionsSuspendPayloadSchema.extend({ finishSetupChain: chainStateSchema }),
    api_types_1.credentialSuspendPayloadSchema.extend({ finishSetupChain: chainStateSchema }),
    api_types_1.channelSuspendPayloadSchema.extend({ finishSetupChain: chainStateSchema }),
]);
const finishSetupResumeSchema = zod_1.z.object({
    approved: zod_1.z.boolean().optional(),
    answers: zod_1.z.array(api_types_1.questionAnswerSchema).optional(),
    credentials: zod_1.z.record(zod_1.z.string()).optional(),
    skipped: zod_1.z.boolean().optional(),
});
function toCardQuestions(questions) {
    return questions?.map(({ configPath: _configPath, ...question }) => question);
}
function answerValue(answer, type) {
    if (answer.skipped)
        return undefined;
    const customText = answer.customText?.trim();
    const value = type === 'multi'
        ? [...answer.selectedOptions, ...(customText ? [customText] : [])].join(', ')
        : customText || answer.selectedOptions.join(', ');
    return value || undefined;
}
function collectConfigWrites(input, collected) {
    const credentials = [];
    for (const [key, outcome] of Object.entries(collected.credentials ?? {})) {
        if (outcome === 'skipped')
            continue;
        const request = input.credentialRequests?.find((slot) => (slot.credentialSlot ?? slot.credentialType) === key);
        credentials.push({ credentialType: request?.credentialType ?? key, ...outcome });
    }
    const values = [];
    for (const question of input.questions ?? []) {
        if (!question.configPath)
            continue;
        const answer = collected.answers?.find((a) => a.questionId === question.id);
        const value = answer ? answerValue(answer, question.type) : undefined;
        if (value !== undefined)
            values.push({ path: question.configPath, value });
    }
    return { credentials, values };
}
async function complete(input, collected, deps) {
    const result = { completed: true, ...collected };
    if (!deps.applySetupToConfig)
        return result;
    const writes = collectConfigWrites(input, collected);
    if (writes.credentials.length === 0 && writes.values.length === 0)
        return result;
    try {
        const applied = await deps.applySetupToConfig(writes);
        if (applied.credentialTypes.length > 0 || applied.paths.length > 0) {
            result.appliedToConfig = { credentialTypes: applied.credentialTypes, paths: applied.paths };
        }
        if (applied.configHash)
            result.configHash = applied.configHash;
        if (applied.errors?.length)
            result.configApplyErrors = applied.errors;
    }
    catch (error) {
        result.configApplyErrors = [
            { path: '(root)', message: error instanceof Error ? error.message : String(error) },
        ];
    }
    return result;
}
function normalizeCheckpointCollected({ channels, ...collected }) {
    if (!channels)
        return collected;
    const normalizedChannels = {};
    for (const [integrationType, outcome] of Object.entries(channels)) {
        normalizedChannels[integrationType] = outcome === 'connected' ? 'configured' : outcome;
    }
    return { ...collected, channels: normalizedChannels };
}
function validateCredentialTypes(input, deps) {
    for (const request of input.credentialRequests ?? []) {
        if (deps.isCredentialTypeKnown && !deps.isCredentialTypeKnown(request.credentialType)) {
            throw new Error(`Unknown credential type "${request.credentialType}". Use an exact n8n credential type name.`);
        }
    }
}
async function validateChannelTypes(input, deps) {
    const availableChannelTypes = await deps.listChatIntegrationTypes();
    for (const channel of input.channels ?? []) {
        if (!availableChannelTypes.includes(channel.integrationType)) {
            const availableMessage = availableChannelTypes.length
                ? ` Available: ${availableChannelTypes.join(', ')}.`
                : ' No chat channels are currently available.';
            throw new Error(`Unsupported chat channel "${channel.integrationType}". Call agent-context with type "integrations" ` +
                'and choose a returned type.' +
                availableMessage);
        }
    }
}
async function computeInitialPlan(input, deps) {
    validateCredentialTypes(input, deps);
    await validateChannelTypes(input, deps);
    const collected = {};
    const pendingSlots = [];
    const aiGatewayManagedTypes = new Set((await deps.listAiGatewayManagedCredentialTypes?.()) ?? []);
    const credentialRequests = (input.credentialRequests ?? []).filter((slot) => !aiGatewayManagedTypes.has(slot.credentialType));
    if (credentialRequests.length) {
        const integrationCredentialIds = (await deps.listIntegrationCredentialIds?.()) ?? [];
        const all = await deps.credentialService.list({ projectId: deps.projectId });
        const credentials = {};
        for (const slot of credentialRequests) {
            const key = slot.credentialSlot ?? slot.credentialType;
            const existingCredentials = credentialsOfType(all, slot.credentialType);
            const channelMatch = existingCredentials.find((credential) => integrationCredentialIds.includes(credential.id));
            const autoResolved = channelMatch ??
                ((0, api_types_1.shouldAutoResolveCredential)(slot.credentialType, existingCredentials.length)
                    ? existingCredentials[0]
                    : undefined);
            if (autoResolved) {
                credentials[key] = autoResolved;
            }
            else {
                pendingSlots.push(slot);
            }
        }
        if (Object.keys(credentials).length > 0)
            collected.credentials = credentials;
    }
    const phases = [];
    if (input.questions?.length)
        phases.push({ kind: 'questions' });
    if (pendingSlots.length > 0)
        phases.push({ kind: 'credentials', slots: pendingSlots });
    for (const channel of input.channels ?? []) {
        phases.push({ kind: 'channel', integrationType: channel.integrationType });
    }
    return { phases, collected };
}
async function mergeResumeIntoCollected(phase, resumeData, previous, deps) {
    if (phase.kind === 'questions') {
        const answers = resumeData?.answers ?? [];
        const skippedCount = answers.filter((answer) => answer.skipped === true).length;
        const hasUsableAnswer = answers.some((answer) => answer.skipped !== true);
        deps.track(telemetry_1.TELEMETRY_EVENT.AGENTS.USER_ANSWERED_BUILDER_QUESTIONS, {
            outcome: resumeData?.approved === false ? 'dismissed' : hasUsableAnswer ? 'answered' : 'skipped',
            answered_count: answers.length - skippedCount,
            skipped_count: skippedCount,
        });
        return { ...previous, answers };
    }
    if (phase.kind === 'channel') {
        const channels = { ...(previous.channels ?? {}) };
        channels[phase.integrationType] = resumeData?.approved ? 'configured' : 'skipped';
        if (resumeData?.approved) {
            deps.track(telemetry_1.TELEMETRY_EVENT.AGENTS.BUILDER_ADDED_TRIGGER, {
                trigger_type: phase.integrationType,
            });
        }
        return { ...previous, channels };
    }
    const credentials = { ...(previous.credentials ?? {}) };
    for (const slot of phase.slots) {
        const key = slot.credentialSlot ?? slot.credentialType;
        const credentialId = resumeData?.credentials?.[slot.credentialType];
        deps.track(telemetry_1.TELEMETRY_EVENT.AGENTS.USER_PROVIDED_CREDENTIAL, {
            credential_type: slot.credentialType,
            outcome: credentialId ? 'provided' : 'skipped',
        });
        credentials[key] = credentialId
            ? {
                id: credentialId,
                name: await credentialNameById(deps.credentialService, credentialId),
            }
            : 'skipped';
    }
    return { ...previous, credentials };
}
async function suspendForPhase(params) {
    const { phase, remainingPhases, collected, totalPhases, phaseNumber, questions, deps, ctx } = params;
    const finishSetupChain = {
        currentPhase: phase,
        remainingPhases,
        collected,
        totalPhases,
    };
    const message = `Finish setup (${phaseNumber}/${totalPhases})`;
    if (phase.kind === 'questions') {
        deps.track(telemetry_1.TELEMETRY_EVENT.AGENTS.BUILDER_ASKED_QUESTIONS, {
            question_count: (questions ?? []).length,
            question_types: [...new Set((questions ?? []).map((q) => q.type))].sort(),
        });
        return await ctx.suspend({
            requestId: (0, nanoid_1.nanoid)(),
            message,
            severity: 'info',
            inputType: 'questions',
            questions: questions ?? [],
            finishSetupChain,
        });
    }
    if (phase.kind === 'channel') {
        return await ctx.suspend({
            requestId: (0, nanoid_1.nanoid)(),
            message: `Set up the ${phase.integrationType} channel`,
            severity: 'info',
            channelConfig: { integrationType: phase.integrationType, agentId: deps.agentId },
            projectId: deps.projectId,
            finishSetupChain,
        });
    }
    const all = await deps.credentialService.list({ projectId: deps.projectId });
    const seenTypes = new Set();
    const credentialRequests = [];
    for (const slot of phase.slots) {
        if (seenTypes.has(slot.credentialType))
            continue;
        seenTypes.add(slot.credentialType);
        deps.track(telemetry_1.TELEMETRY_EVENT.AGENTS.BUILDER_REQUESTED_CREDENTIAL, {
            credential_type: slot.credentialType,
        });
        credentialRequests.push({
            credentialType: slot.credentialType,
            reason: slot.purpose,
            existingCredentials: credentialsOfType(all, slot.credentialType),
        });
    }
    return await ctx.suspend({
        requestId: (0, nanoid_1.nanoid)(),
        message,
        severity: 'info',
        credentialRequests,
        credentialFlow: { stage: 'generic' },
        projectId: deps.projectId,
        finishSetupChain,
    });
}
async function startPlan(input, ctx, deps) {
    const { phases, collected } = await computeInitialPlan(input, deps);
    if (phases.length === 0) {
        return await complete(input, collected, deps);
    }
    const [currentPhase, ...remainingPhases] = phases;
    return await suspendForPhase({
        phase: currentPhase,
        remainingPhases,
        collected,
        totalPhases: phases.length,
        phaseNumber: 1,
        questions: toCardQuestions(input.questions),
        deps,
        ctx,
    });
}
async function resumePlan(input, ctx, deps) {
    const chain = ctx.suspendPayload.finishSetupChain;
    const collected = await mergeResumeIntoCollected(chain.currentPhase, ctx.resumeData, normalizeCheckpointCollected(chain.collected), deps);
    if (chain.remainingPhases.length === 0) {
        return await complete(input, collected, deps);
    }
    const [nextPhase, ...restPhases] = chain.remainingPhases;
    return await suspendForPhase({
        phase: nextPhase,
        remainingPhases: restPhases,
        collected,
        totalPhases: chain.totalPhases,
        phaseNumber: chain.totalPhases - restPhases.length,
        questions: toCardQuestions(input.questions),
        deps,
        ctx,
    });
}
function buildFinishSetupTool(deps) {
    return new tool_1.Tool(builder_tool_names_1.BUILDER_TOOLS.FINISH_SETUP)
        .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(builder_tool_names_1.BUILDER_TOOLS.FINISH_SETUP))
        .description('Collect everything still needed to finish the initial build in ONE guided flow: open ' +
        'questions (including the model choice), credential slots, and chat-channel ' +
        'setup. Call it at most once, only in the trailing step of an initial build ' +
        'when only pending setup remains, and never together with another interactive tool. ' +
        'It shows setup cards back-to-back without returning control between them: questions, ' +
        'then credentials, then one card per requested channel. Channel cards always run last ' +
        'after every credential phase, including when earlier setup was skipped or dismissed. Pass ' +
        '`channels` with a returned `type` from agent-context integrations, one entry per channel ' +
        'to configure; do not infer channel names. Each channel card persists the configuration ' +
        'or skips it, so channel outcomes are `"configured"` or `"skipped"`. Do not call ' +
        'agent_builder_configure_channel again for a channel handled by ' +
        'this flow. When a question answers a value that already has a place in the config ' +
        '(a recipient, a channel id, a sheet id), give it `configPath`: the answer is written ' +
        'there as a string. Write that config field empty beforehand, never skip the tool. ' +
        'Returns { completed, answers, credentials, channels, appliedToConfig, configHash } ' +
        '(plus configMutated/agentId refresh metadata when completed). The tool already wrote ' +
        'each resolved credential into every empty node-tool slot of its type, and each ' +
        'configPath answer; `appliedToConfig` lists them. Do not patch those again. Resolve ' +
        'only what is left: the model answer with agent_builder_resolve_llm, MCP servers with ' +
        'agent_builder_verify_mcp_server, and any entry in `configApplyErrors`. Auto-resolves ' +
        'credential slots that match an existing single credential or configured channel credential.')
        .input(finishSetupInputSchema)
        .suspend(finishSetupSuspendSchema)
        .resume(finishSetupResumeSchema)
        .handler(async (input, ctx) => {
        if (ctx.suspendPayload) {
            return await resumePlan(input, ctx, deps);
        }
        return await startPlan(input, ctx, deps);
    })
        .build();
}
//# sourceMappingURL=finish-setup.tool.js.map