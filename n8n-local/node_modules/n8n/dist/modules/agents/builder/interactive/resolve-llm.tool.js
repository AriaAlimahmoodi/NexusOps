"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildResolveLlmTool = buildResolveLlmTool;
const tool_1 = require("@n8n/agents/tool");
const model_discovery_1 = require("@n8n/ai-utilities/model-discovery");
const api_types_1 = require("@n8n/api-types");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const llm_provider_defaults_1 = require("../../llm-provider-defaults");
const provider_model_id_1 = require("../../utils/provider-model-id");
const builder_tool_names_1 = require("../builder-tool-names");
const N8N_CONNECT_CREDENTIAL_NAME = 'Gateway credits';
const FREE_CREDITS_MODEL = 'gpt-5-mini';
async function resolveFreeCreditsModel(credential, modelLookup) {
    const lookup = await listCallableModels(credential, 'openai', modelLookup);
    if (!lookup.ok || lookup.models.length === 0)
        return FREE_CREDITS_MODEL;
    const modelIds = lookup.models.map((model) => model.value);
    return (0, provider_model_id_1.findVerifiedModelId)('openai', FREE_CREDITS_MODEL, modelIds) ?? modelIds[0];
}
async function tryClaimFreeCredits(freeCredits, modelLookup) {
    try {
        if (!(await freeCredits.isEligible()))
            return null;
        const { credentialId, credentialName } = await freeCredits.claim();
        return {
            ok: true,
            provider: 'openai',
            model: await resolveFreeCreditsModel({ id: credentialId, name: credentialName, type: n8n_workflow_1.OPEN_AI_API_CREDENTIAL_TYPE }, modelLookup),
            credentialId,
            credentialName,
            claimedFreeOpenAiCredits: true,
        };
    }
    catch {
        return null;
    }
}
function findProviderDefault(provider) {
    const requestedProvider = provider.trim();
    return Object.entries(llm_provider_defaults_1.LLM_PROVIDER_DEFAULTS).find(([, defaults]) => defaults.provider === requestedProvider);
}
function toLlmResolution(credential, defaults, model) {
    return {
        ok: true,
        provider: defaults.provider,
        model: model?.trim() || defaults.defaultModel,
        credentialId: credential.id,
        credentialName: credential.name,
    };
}
const MAX_AVAILABLE_MODELS = 25;
function unknownModel(provider, requestedModel, availableModels) {
    const shown = availableModels.slice(0, MAX_AVAILABLE_MODELS);
    return {
        ok: false,
        reason: 'unknown_model',
        provider,
        requestedModel,
        availableModels: shown,
        ...(shown.length < availableModels.length
            ? {
                availableModelsTruncated: true,
                totalAvailableModels: availableModels.length,
            }
            : {}),
    };
}
function modelLookupFailed(provider, requestedModel, error) {
    return {
        ok: false,
        reason: 'model_lookup_failed',
        provider,
        requestedModel,
        error: error instanceof Error ? error.message : String(error),
    };
}
async function listCallableModels(credential, provider, modelLookup) {
    try {
        const models = await modelLookup.list(credential.id, credential.type, provider);
        return {
            ok: true,
            models: models.map(({ name, value }) => ({
                name: (0, provider_model_id_1.normalizeProviderModelId)(provider, name),
                value: (0, provider_model_id_1.normalizeProviderModelId)(provider, value),
            })),
        };
    }
    catch (error) {
        return { ok: false, error };
    }
}
async function resolveModelAgainstLookup(credential, defaults, requestedModel, modelLookup) {
    const trimmedModel = requestedModel.trim();
    if (!(0, model_discovery_1.isModelDiscoveryProvider)(defaults.provider) || !trimmedModel) {
        return toLlmResolution(credential, defaults, requestedModel);
    }
    const lookup = await listCallableModels(credential, defaults.provider, modelLookup);
    if (!lookup.ok)
        return modelLookupFailed(defaults.provider, trimmedModel, lookup.error);
    const availableModels = lookup.models;
    const verified = (0, provider_model_id_1.findVerifiedModelId)(defaults.provider, trimmedModel, availableModels.map((m) => m.value));
    if (verified)
        return toLlmResolution(credential, defaults, verified);
    const lowerHint = (0, provider_model_id_1.normalizeProviderModelId)(defaults.provider, trimmedModel).toLowerCase();
    const candidates = availableModels.filter((m) => m.value.toLowerCase().includes(lowerHint) || m.name.toLowerCase().includes(lowerHint));
    if (candidates.length === 1) {
        return toLlmResolution(credential, defaults, candidates[0].value);
    }
    return unknownModel(defaults.provider, trimmedModel, candidates.length > 0 ? candidates : availableModels);
}
async function resolveDefaultModelForCredential(credential, defaults, modelLookup) {
    if (!(0, model_discovery_1.isModelDiscoveryProvider)(defaults.provider)) {
        return toLlmResolution(credential, defaults);
    }
    const lookup = await listCallableModels(credential, defaults.provider, modelLookup);
    if (!lookup.ok)
        return modelLookupFailed(defaults.provider, defaults.defaultModel, lookup.error);
    const availableModels = lookup.models;
    if (availableModels.length > 0) {
        const verified = (0, provider_model_id_1.findVerifiedModelId)(defaults.provider, defaults.defaultModel, availableModels.map((m) => m.value));
        if (verified)
            return toLlmResolution(credential, defaults, verified);
        if (credential.id === api_types_1.AI_GATEWAY_MANAGED_TAG) {
            return toLlmResolution(credential, defaults, availableModels[0].value);
        }
    }
    return unknownModel(defaults.provider, defaults.defaultModel, availableModels);
}
async function resolveManagedCredentialForProvider(provider, model, deps) {
    const providerEntry = findProviderDefault(provider);
    if (!providerEntry) {
        return {
            ok: false,
            reason: 'unsupported_provider',
            provider,
            supportedProviders: Object.values(llm_provider_defaults_1.LLM_PROVIDER_DEFAULTS).map((defaults) => defaults.provider),
        };
    }
    const [credentialType, defaults] = providerEntry;
    const served = (await deps.isProviderServedByGateway?.(defaults.provider)) ?? false;
    if (!served) {
        return {
            ok: false,
            reason: 'gateway_credits_unsupported_provider',
            provider: defaults.provider,
        };
    }
    const managed = {
        id: api_types_1.AI_GATEWAY_MANAGED_TAG,
        name: N8N_CONNECT_CREDENTIAL_NAME,
        type: credentialType,
    };
    if (model?.trim()) {
        return await resolveModelAgainstLookup(managed, defaults, model, deps.modelLookup);
    }
    return await resolveDefaultModelForCredential(managed, defaults, deps.modelLookup);
}
async function servedGatewayProviders(deps) {
    const served = new Set();
    for (const defaults of Object.values(llm_provider_defaults_1.LLM_PROVIDER_DEFAULTS)) {
        if ((await deps.isProviderServedByGateway?.(defaults.provider)) ?? false) {
            served.add(defaults.provider);
        }
    }
    return [...served];
}
function buildResolveLlmTool(deps) {
    return new tool_1.Tool(builder_tool_names_1.BUILDER_TOOLS.RESOLVE_LLM)
        .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(builder_tool_names_1.BUILDER_TOOLS.RESOLVE_LLM))
        .description('Resolve the agent main LLM without showing a picker. ' +
        'A fresh agent may already have a model and credential persisted by the system at creation ' +
        '(a sensible default was auto-selected). Before calling this tool on a fresh agent, call ' +
        'agent-context with type "config" first: if model and credential are already set, keep them, mention the choice ' +
        'in your summary as changeable, and do not call agent_builder_resolve_llm. Only when model is empty call ' +
        'agent_builder_resolve_llm once, silently, before the first config write to detect existing credentials — ' +
        'with provider/model when the user named them, otherwise without arguments. ' +
        'Also call it whenever the user names or changes a provider or model. ' +
        'If provider is given, resolves only that provider; if model is omitted, uses the ' +
        'provider default model. Every model it returns — the default included — is checked ' +
        'against the list the chosen credential can actually reach, so reason "unknown_model" ' +
        '(carrying availableModels) can come back even when you passed no model: retry with a ' +
        'value from availableModels, never the id that just failed. availableModels is capped: when ' +
        'availableModelsTruncated is true, it is a sample of totalAvailableModels — ask the user with ' +
        'agent_builder_ask_questions instead of treating it as the full list. For "Anthropic via OpenRouter", pass provider="openrouter" ' +
        'and omit model unless the user named a concrete OpenRouter model id. Returns ok=false ' +
        'when credentials are missing, unsupported, or ambiguous — during an initial build, do not ' +
        'ask; keep building with model "" and include the model choice in the trailing ' +
        'agent_builder_finish_setup call, then call agent_builder_resolve_llm again with the answer. For a model ' +
        'change on an existing agent, ask immediately and keep the current model and credential until the new one resolves. ' +
        'When no matching credential exists and the user is eligible for free OpenAI credits, the tool ' +
        'claims them automatically and resolves to an OpenAI model the new key can reach (normally ' +
        'gpt-5-mini) — the result carries ' +
        'claimedFreeOpenAiCredits: true; tell the user free OpenAI credits were set up. When the ' +
        'provider has no own credential but Gateway credits (the managed option) serve it, the tool ' +
        'resolves to the managed credential — the result credentialName is "Gateway credits"; persist it ' +
        'like any credential and tell the user the model runs on Gateway credits. When the user ' +
        'explicitly asks to use Gateway credits, pass useGatewayCredits: true (with provider when named): ' +
        'the tool resolves Gateway credits for that provider without a picker even if the user has their ' +
        'own credential for it, and returns ok=false with reason "gateway_credits_unsupported_provider", ' +
        '"ambiguous_gateway_credits_provider" (with providers), or "gateway_credits_unavailable" (Gateway ' +
        'credits serve no provider on this instance) when it cannot. When multiple ' +
        'providers each have one credential, the tool auto-picks the recommended provider — the result ' +
        'carries autoPicked: true and otherProviders; state the pick as changeable, do not ask to confirm it. ' +
        'When the user picks between multiple credentials of one provider, pass the picked credentialId ' +
        'from the earlier ambiguous result.')
        .input(zod_1.z.object({
        provider: zod_1.z
            .string()
            .optional()
            .describe('Requested provider, e.g. "anthropic", "openai", or "openrouter".'),
        model: zod_1.z
            .string()
            .optional()
            .describe('Requested model without the selected provider prefix. For OpenRouter use the routed id, e.g. "anthropic/claude-sonnet-5".'),
        credentialId: zod_1.z
            .string()
            .optional()
            .describe('Credential id picked by the user from an earlier ambiguous agent_builder_resolve_llm result.'),
        useGatewayCredits: zod_1.z
            .boolean()
            .optional()
            .describe('Set true when the user explicitly asked to use Gateway credits for the main model. ' +
            'Resolves Gateway credits for the requested provider even if the user already has ' +
            'their own credential for it, and never asks. Pass `provider` when the user named one.'),
    }))
        .handler(async ({ provider, model, credentialId, useGatewayCredits, }) => {
        if (useGatewayCredits) {
            if (provider) {
                return await resolveManagedCredentialForProvider(provider, model, deps);
            }
            const served = await servedGatewayProviders(deps);
            if (served.length === 1) {
                return await resolveManagedCredentialForProvider(served[0], model, deps);
            }
            if (served.length === 0) {
                return { ok: false, reason: 'gateway_credits_unavailable' };
            }
            return {
                ok: false,
                reason: 'ambiguous_gateway_credits_provider',
                providers: served,
            };
        }
        const all = await deps.credentialProvider.list();
        const ownCredentials = all.filter((credential) => llm_provider_defaults_1.LLM_PROVIDER_DEFAULTS[credential.type]);
        const managedCredentials = [];
        for (const [credentialType, defaults] of Object.entries(llm_provider_defaults_1.LLM_PROVIDER_DEFAULTS)) {
            const hasOwnCredential = ownCredentials.some((c) => c.type === credentialType);
            if (!hasOwnCredential &&
                ((await deps.isProviderServedByGateway?.(defaults.provider)) ?? false)) {
                managedCredentials.push({
                    id: api_types_1.AI_GATEWAY_MANAGED_TAG,
                    name: N8N_CONNECT_CREDENTIAL_NAME,
                    type: credentialType,
                });
            }
        }
        const llmCredentials = [...ownCredentials, ...managedCredentials];
        if (credentialId) {
            const matchingCredentials = llmCredentials.filter((c) => c.id === credentialId);
            if (matchingCredentials.length === 0) {
                return {
                    ok: false,
                    reason: 'unknown_credential',
                    credentialId,
                    credentials: llmCredentials.map((c) => ({
                        id: c.id,
                        name: c.name,
                        type: c.type,
                    })),
                };
            }
            let candidates = matchingCredentials;
            if (provider) {
                const providerEntry = findProviderDefault(provider);
                if (!providerEntry) {
                    return {
                        ok: false,
                        reason: 'unsupported_provider',
                        provider,
                        supportedProviders: Object.values(llm_provider_defaults_1.LLM_PROVIDER_DEFAULTS).map((defaults) => defaults.provider),
                    };
                }
                const [credentialType] = providerEntry;
                candidates = matchingCredentials.filter((c) => c.type === credentialType);
            }
            const credential = candidates.length === 1 ? candidates[0] : undefined;
            if (!credential) {
                return {
                    ok: false,
                    reason: 'ambiguous_credential',
                    credentials: matchingCredentials.map((c) => {
                        const defaults = llm_provider_defaults_1.LLM_PROVIDER_DEFAULTS[c.type];
                        return {
                            id: c.id,
                            name: c.name,
                            type: c.type,
                            provider: defaults.provider,
                        };
                    }),
                };
            }
            const defaults = llm_provider_defaults_1.LLM_PROVIDER_DEFAULTS[credential.type];
            if (model?.trim()) {
                return await resolveModelAgainstLookup(credential, defaults, model, deps.modelLookup);
            }
            return await resolveDefaultModelForCredential(credential, defaults, deps.modelLookup);
        }
        if (provider) {
            const providerEntry = findProviderDefault(provider);
            if (!providerEntry) {
                return {
                    ok: false,
                    reason: 'unsupported_provider',
                    provider,
                    supportedProviders: Object.values(llm_provider_defaults_1.LLM_PROVIDER_DEFAULTS).map((defaults) => defaults.provider),
                };
            }
            const [credentialType, defaults] = providerEntry;
            const matchingCredentials = llmCredentials.filter((credential) => credential.type === credentialType);
            if (matchingCredentials.length === 1) {
                const credential = matchingCredentials[0];
                if (model?.trim()) {
                    return await resolveModelAgainstLookup(credential, defaults, model, deps.modelLookup);
                }
                return await resolveDefaultModelForCredential(credential, defaults, deps.modelLookup);
            }
            if (matchingCredentials.length === 0 &&
                defaults.provider === 'openai' &&
                !model?.trim()) {
                const claimed = await tryClaimFreeCredits(deps.freeCredits, deps.modelLookup);
                if (claimed)
                    return claimed;
            }
            return {
                ok: false,
                reason: matchingCredentials.length === 0
                    ? 'missing_credential'
                    : 'ambiguous_credential',
                provider: defaults.provider,
                credentialType,
                credentials: matchingCredentials.map((credential) => ({
                    id: credential.id,
                    name: credential.name,
                })),
            };
        }
        if (llmCredentials.length === 1) {
            const credential = llmCredentials[0];
            const defaults = llm_provider_defaults_1.LLM_PROVIDER_DEFAULTS[credential.type];
            if (model?.trim()) {
                return await resolveModelAgainstLookup(credential, defaults, model, deps.modelLookup);
            }
            return await resolveDefaultModelForCredential(credential, defaults, deps.modelLookup);
        }
        if (llmCredentials.length === 0 && !model?.trim()) {
            const claimed = await tryClaimFreeCredits(deps.freeCredits, deps.modelLookup);
            if (claimed)
                return claimed;
        }
        if (llmCredentials.length > 1 && !model?.trim()) {
            const byProvider = new Map();
            for (const credential of llmCredentials) {
                const providerName = llm_provider_defaults_1.LLM_PROVIDER_DEFAULTS[credential.type].provider;
                byProvider.set(providerName, [...(byProvider.get(providerName) ?? []), credential]);
            }
            const topProvider = llm_provider_defaults_1.LLM_PROVIDER_PRIORITY.find((candidate) => byProvider.has(candidate));
            const topCredentials = topProvider ? byProvider.get(topProvider) : undefined;
            if (topProvider && topCredentials?.length === 1) {
                const resolved = await resolveDefaultModelForCredential(topCredentials[0], llm_provider_defaults_1.LLM_PROVIDER_DEFAULTS[topCredentials[0].type], deps.modelLookup);
                if (!resolved.ok)
                    return resolved;
                return {
                    ...resolved,
                    autoPicked: true,
                    otherProviders: [...byProvider.keys()].filter((other) => other !== topProvider),
                };
            }
        }
        return {
            ok: false,
            reason: llmCredentials.length === 0
                ? 'missing_credential'
                : 'ambiguous_provider_or_credential',
            credentials: llmCredentials.map((credential) => {
                const defaults = llm_provider_defaults_1.LLM_PROVIDER_DEFAULTS[credential.type];
                return {
                    id: credential.id,
                    name: credential.name,
                    type: credential.type,
                    provider: defaults.provider,
                };
            }),
        };
    })
        .build();
}
//# sourceMappingURL=resolve-llm.tool.js.map