"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAskCredentialTool = buildAskCredentialTool;
exports.buildAskEmbeddingCredentialTool = buildAskEmbeddingCredentialTool;
const tool_1 = require("@n8n/agents/tool");
const api_types_1 = require("@n8n/api-types");
const telemetry_1 = require("@n8n/telemetry");
const nanoid_1 = require("nanoid");
function withNodeCredentialMap(input, credentialId, credentialName) {
    const credentialSlot = input.credentialSlot ?? input.credentialType;
    return {
        credentialId,
        credentialName,
        credentials: {
            [credentialSlot]: { id: credentialId, name: credentialName },
        },
    };
}
async function listExistingCredentials(credentialService, projectId, credentialType) {
    const all = await credentialService.list({ type: credentialType, projectId });
    return all.map((c) => ({ id: c.id, name: c.name }));
}
async function resolveResume(input, resumeData, credentialService, projectId, track) {
    if (!('credentials' in resumeData)) {
        track(telemetry_1.TELEMETRY_EVENT.AGENTS.USER_PROVIDED_CREDENTIAL, {
            credential_type: input.credentialType,
            outcome: 'skipped',
        });
        return { skipped: true };
    }
    const credentialId = resumeData.credentials[input.credentialType];
    if (!credentialId) {
        track(telemetry_1.TELEMETRY_EVENT.AGENTS.USER_PROVIDED_CREDENTIAL, {
            credential_type: input.credentialType,
            outcome: 'skipped',
        });
        return { skipped: true };
    }
    const existingCredentials = await listExistingCredentials(credentialService, projectId, input.credentialType);
    const match = existingCredentials.find((c) => c.id === credentialId);
    track(telemetry_1.TELEMETRY_EVENT.AGENTS.USER_PROVIDED_CREDENTIAL, {
        credential_type: input.credentialType,
        outcome: 'provided',
    });
    return withNodeCredentialMap(input, credentialId, match?.name ?? credentialId);
}
async function resolveCredentialSelection(input, ctx, deps) {
    if (ctx.resumeData !== undefined && ctx.resumeData !== null) {
        return await resolveResume(input, ctx.resumeData, deps.credentialService, deps.projectId, deps.track);
    }
    if (deps.isCredentialTypeKnown && !deps.isCredentialTypeKnown(input.credentialType)) {
        throw new Error(`Unknown credential type "${input.credentialType}". Use an exact n8n credential type name.`);
    }
    const existingCredentials = await listExistingCredentials(deps.credentialService, deps.projectId, input.credentialType);
    const integrationCredentialIds = (await deps.listIntegrationCredentialIds?.()) ?? [];
    const channelCredential = existingCredentials.find((credential) => integrationCredentialIds.includes(credential.id));
    if (channelCredential) {
        return withNodeCredentialMap(input, channelCredential.id, channelCredential.name);
    }
    if ((0, api_types_1.shouldAutoResolveCredential)(input.credentialType, existingCredentials.length)) {
        return withNodeCredentialMap(input, existingCredentials[0].id, existingCredentials[0].name);
    }
    deps.track(telemetry_1.TELEMETRY_EVENT.AGENTS.BUILDER_REQUESTED_CREDENTIAL, {
        credential_type: input.credentialType,
    });
    return await ctx.suspend({
        requestId: (0, nanoid_1.nanoid)(),
        message: input.purpose,
        severity: 'info',
        credentialRequests: [
            {
                credentialType: input.credentialType,
                reason: input.purpose,
                existingCredentials,
            },
        ],
        credentialFlow: { stage: 'generic' },
        projectId: deps.projectId,
    });
}
function buildAskCredentialTool(deps) {
    return new tool_1.Tool(api_types_1.ASK_CREDENTIAL_TOOL_NAME)
        .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(api_types_1.ASK_CREDENTIAL_TOOL_NAME))
        .description('Show a credential picker card in the chat UI and suspend until the user selects ' +
        'a credential. Call ONCE per credential slot. For an addition to an existing agent, ' +
        'call it before the agent_builder_write_config / agent_builder_patch_config that introduces the tool. Never call ' +
        'this during an initial build — follow the Initial Build rules in the agent-builder skill; ' +
        'use it for additions to an existing agent and follow-up setup turns. ' +
        'Returns { credentialId, credentialName, credentials } on success ' +
        'or { skipped: true } if the user skips credential setup so the tool can be added ' +
        'without credentials. For node tools, copy the returned `credentials` object into `node.credentials`. Auto-resolves without ' +
        'rendering a card when the agent has a chat channel configured whose credential matches the ' +
        'requested type (the channel credential is reused so tools act through the same connection), ' +
        'or when the user has exactly one credential of the requested type — except for generic ' +
        'auth types (bearer, header, query, basic, digest, custom, OAuth), which always render the card.')
        .input(api_types_1.askCredentialInputSchema)
        .suspend(api_types_1.credentialSuspendPayloadSchema)
        .resume(api_types_1.credentialResumeSchema)
        .handler(async (input, ctx) => {
        return await resolveCredentialSelection(input, ctx, deps);
    })
        .build();
}
function buildAskEmbeddingCredentialTool(deps) {
    return new tool_1.Tool(api_types_1.ASK_EMBEDDING_CREDENTIAL_TOOL_NAME)
        .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(api_types_1.ASK_EMBEDDING_CREDENTIAL_TOOL_NAME))
        .description('Resolve the OpenAI embedding credential for Episodic Memory. Tries to resolve n8n managed credential. Otherwise behaves ' +
        'like agent_builder_ask_credential: show a credential picker card in the chat UI and suspend until ' +
        'the user selects a credential. Returns { credentialId, credentialName, credentials } ' +
        'on success or { skipped: true } if the user skips credential setup.')
        .input(api_types_1.askCredentialInputSchema)
        .suspend(api_types_1.credentialSuspendPayloadSchema)
        .resume(api_types_1.credentialResumeSchema)
        .handler(async (input, ctx) => {
        if (deps.isAssistantProxyEnabled()) {
            return withNodeCredentialMap(input, api_types_1.MANAGED_CREDENTIAL_TOKEN, 'Managed by n8n');
        }
        return await resolveCredentialSelection(input, ctx, deps);
    })
        .build();
}
//# sourceMappingURL=ask-credential.tool.js.map