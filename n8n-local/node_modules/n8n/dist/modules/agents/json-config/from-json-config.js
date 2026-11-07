"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFromJson = buildFromJson;
exports.buildProviderToolsForModel = buildProviderToolsForModel;
const agents_1 = require("@n8n/agents");
const tool_1 = require("@n8n/agents/tool");
const agent_config_1 = require("@n8n/ai-utilities/agent-config");
const api_types_1 = require("@n8n/api-types");
const n8n_workflow_1 = require("n8n-workflow");
const crypto_1 = require("crypto");
const zod_1 = require("zod");
const embedding_credential_1 = require("./embedding-credential");
const model_config_1 = require("./model-config");
const provider_tool_aliases_1 = require("./provider-tool-aliases");
const web_search_credential_1 = require("./web-search-credential");
const vector_store_factory_1 = require("./vector-store-factory");
const WEB_SEARCH_TOOL_NAME = 'web_search';
const WEB_SEARCH_INPUT_SCHEMA = zod_1.z.object({
    query: zod_1.z.string().min(1).describe('Search query'),
    maxResults: zod_1.z.number().int().min(1).max(10).optional().describe('Maximum number of results'),
    includeDomains: zod_1.z.array(zod_1.z.string()).optional().describe('Only return results from these domains'),
    excludeDomains: zod_1.z.array(zod_1.z.string()).optional().describe('Exclude results from these domains'),
});
const WEB_SEARCH_PLAN_INSTRUCTION = 'Before using web_search, choose the smallest search plan that can answer the user. Default to one broad, high-signal query. After each search, stop if the results already contain enough credible sources to answer. Use a second search only when the first result set is insufficient or the user asked for comparison across independent source categories. Do not fan out variations of the same query, and do not search for confirmation only. Use more than two searches only when the user explicitly asks for deep research, exhaustive coverage, or multiple independent topics.';
const WEB_SEARCH_POLICY_INSTRUCTION = '### Web search policy\n' +
    'Use web search only on high-signal requests: explicit web/current/latest/live/recent/research/source requests, or questions that require up-to-date external facts. Do not use web search for static knowledge, uploaded knowledge, local config, codebase questions, or confirmation. Prefer answering directly or using local knowledge tools first. One search is usually enough; do not search repeatedly unless the user asks for deep research.';
const PREVIEW_SELF_MODIFICATION_POLICY = '### Preview chat policy\n' +
    'This conversation only runs you. You can change things in n8n, including your own setup, only through your tools. Your setup is your instructions, model, tools, skills, knowledge, channels, integrations, schedules, name and any other part of your configuration. A request that names no other owner, such as "add a tool" or "connect a Slack channel", is about your setup.\n' +
    'If none of your tools can make a change that the user asks for, say plainly that you cannot make it here, and tell them to ask the n8n Assistant, which edits the agent for them.\n' +
    'Never claim that a change was applied unless a tool result confirms it.';
async function buildFromJson(config, toolDescriptors, options) {
    const { Agent, createRuntimeSkillRegistry } = await import('@n8n/agents');
    const agent = new Agent(config.name);
    const resolvedModelConfig = await resolveModelConfig(config, options.credentialProvider);
    agent.model(resolvedModelConfig);
    if (options.modelFetch) {
        agent.modelFetch(options.modelFetch);
    }
    const configuredSkillSource = getConfiguredSkillSource(config.skills ?? [], options.skills ?? {}, createRuntimeSkillRegistry);
    agent.instructions(buildInstructions(config, options));
    if (config.tools) {
        for (const ref of config.tools) {
            if (ref.enabled === false)
                continue;
            const built = await resolveToolRef(ref, toolDescriptors, options);
            if (built) {
                agent.tool(built);
            }
        }
    }
    if (config.mcpServers?.length && options.buildMcpClient) {
        for (const server of config.mcpServers) {
            if (!server.url.trim())
                continue;
            if (server.authentication !== 'none' &&
                !server.credential &&
                !options.attachAuthPendingMcpServers)
                continue;
            const client = await options.buildMcpClient(server);
            agent.mcp(client);
        }
    }
    if (config.vectorStores?.length) {
        for (const vectorStoreConfig of config.vectorStores) {
            if (!vectorStoreConfig.credential || !vectorStoreConfig.embedding.credential)
                continue;
            const vectorStore = await (0, vector_store_factory_1.buildVectorStore)(vectorStoreConfig, options.credentialProvider);
            agent.vectorStore(vectorStore, { description: vectorStoreConfig.useWhen });
        }
    }
    agent.skills(configuredSkillSource);
    const providerTools = (0, agent_config_1.getNativeWebSearchProviderTools)(config, { includeDefaultArgs: false });
    if (providerTools) {
        for (const [name, args] of Object.entries(providerTools)) {
            const resolved = (0, provider_tool_aliases_1.resolveProviderToolName)(name);
            agent.providerTool({ name: resolved, args });
        }
    }
    const fallbackWebSearchTool = buildFallbackWebSearchTool(config, options.credentialProvider, options.webSearchFetch, options.fallbackWebSearch);
    if (fallbackWebSearchTool) {
        agent.tool(fallbackWebSearchTool);
    }
    if (config.memory?.enabled) {
        await applyMemoryFromConfig(agent, config.memory, options.memoryFactory, options.credentialProvider, options.resolveManagedEmbeddingProviderOptions);
    }
    if (config.config) {
        if (config.config.reasoning) {
            agent.reasoning(config.config.reasoning);
        }
        if (config.config.promptCaching) {
            agent.promptCaching(config.config.promptCaching);
        }
        if (config.config.toolCallConcurrency) {
            agent.toolCallConcurrency(config.config.toolCallConcurrency);
        }
        if (config.config.maxIterations) {
            agent.configuration({ maxIterations: config.config.maxIterations });
        }
    }
    return agent;
}
function getProviderToolPrefix(toolName) {
    const dotIndex = toolName.indexOf('.');
    return dotIndex > 0 ? toolName.slice(0, dotIndex) : undefined;
}
function buildInstructions(config, options) {
    const policies = [
        config.config?.webSearch?.enabled === true ? WEB_SEARCH_POLICY_INSTRUCTION : undefined,
        options.previewChat === true ? PREVIEW_SELF_MODIFICATION_POLICY : undefined,
    ].filter((policy) => policy !== undefined);
    if (policies.length === 0)
        return config.instructions;
    return [config.instructions.trimEnd(), ...policies].join('\n\n');
}
function buildProviderToolsForModel(config, modelConfig) {
    const modelId = (0, agents_1.modelConfigToId)(modelConfig);
    if (!modelId)
        return [];
    const providerPrefix = (0, agent_config_1.getProviderPrefix)(modelId);
    if (!providerPrefix)
        return [];
    const providerTools = (0, agent_config_1.getNativeWebSearchProviderTools)({ ...config, model: modelId }, { includeDefaultArgs: false });
    return Object.entries(providerTools)
        .map(([name, args]) => ({
        name: (0, provider_tool_aliases_1.resolveProviderToolName)(name),
        args,
    }))
        .filter((tool) => getProviderToolPrefix(tool.name) === providerPrefix);
}
function buildFallbackWebSearchTool(config, credentialProvider, webSearchFetch, fallbackWebSearch) {
    const webSearchConfig = config.config?.webSearch;
    if (!webSearchConfig?.enabled)
        return null;
    if ((0, agent_config_1.isNativeWebSearchRequested)(config) && (0, agent_config_1.hasNativeWebSearchProvider)(config.model))
        return null;
    if (fallbackWebSearch) {
        return {
            name: WEB_SEARCH_TOOL_NAME,
            description: 'Search the web for current information.',
            systemInstruction: WEB_SEARCH_PLAN_INSTRUCTION,
            inputSchema: WEB_SEARCH_INPUT_SCHEMA,
            handler: async (input) => await fallbackWebSearch(WEB_SEARCH_INPUT_SCHEMA.parse(input)),
        };
    }
    if (webSearchConfig.provider !== 'brave' && webSearchConfig.provider !== 'searxng') {
        throw new n8n_workflow_1.UserError('Web search is enabled but no fallback search provider is configured.');
    }
    if (!webSearchConfig.credential) {
        throw new n8n_workflow_1.UserError('Web search is enabled but no search credential is configured.');
    }
    const credentialId = webSearchConfig.credential;
    return {
        name: WEB_SEARCH_TOOL_NAME,
        description: 'Search the web for current information.',
        systemInstruction: WEB_SEARCH_PLAN_INSTRUCTION,
        inputSchema: WEB_SEARCH_INPUT_SCHEMA,
        handler: async (input) => {
            const args = WEB_SEARCH_INPUT_SCHEMA.parse(input);
            const { braveSearch, searxngSearch } = await import('@n8n/ai-utilities');
            const searchOptions = {
                maxResults: args.maxResults,
                includeDomains: args.includeDomains,
                excludeDomains: args.excludeDomains,
            };
            if (webSearchConfig.provider === 'brave') {
                if (credentialId === api_types_1.AI_GATEWAY_MANAGED_TAG) {
                    const proxyConfig = await (0, web_search_credential_1.resolveWebSearchGatewayProxyConfig)(webSearchConfig.provider, credentialProvider);
                    return await braveSearch('', args.query, { ...searchOptions, proxyConfig });
                }
                const credential = await credentialProvider.resolve(credentialId);
                if (typeof credential.apiKey !== 'string') {
                    throw new Error('Brave Search credential is missing an API key.');
                }
                return await braveSearch(credential.apiKey, args.query, searchOptions);
            }
            if (credentialId === api_types_1.AI_GATEWAY_MANAGED_TAG) {
                throw new n8n_workflow_1.UserError('Gateway credits web search is only available for Brave Search.');
            }
            const credential = await credentialProvider.resolve(credentialId);
            if (typeof credential.apiUrl !== 'string') {
                throw new Error('SearXNG credential is missing an API URL.');
            }
            return await searxngSearch(credential.apiUrl, args.query, searchOptions, webSearchFetch);
        },
    };
}
function getConfiguredSkillSource(refs, skills, createRegistry) {
    const seen = new Set();
    const configured = [];
    const referencesBySkillId = new Map();
    for (const ref of refs) {
        if (seen.has(ref.id))
            continue;
        seen.add(ref.id);
        const skill = skills[ref.id];
        if (!skill)
            throw new Error(`Skill "${ref.id}" not found in stored skill bodies`);
        const linkedFiles = linkedFilesForSkill(skill);
        referencesBySkillId.set(ref.id, new Map((skill.references ?? []).map((reference) => [reference.path, reference])));
        configured.push({
            id: ref.id,
            name: skill.name,
            description: skill.description,
            instructions: skill.instructions,
            linkedFiles,
        });
    }
    const skillsById = new Map(configured.map((skill) => [skill.id, skill]));
    return {
        registry: createRegistry(configured),
        loadSkill: async (skillId) => (await Promise.resolve(skillsById.get(skillId))) ?? null,
        loadFile: async (skillId, filePath) => {
            const reference = referencesBySkillId.get(skillId)?.get(filePath);
            if (!reference)
                return await Promise.resolve(null);
            return await Promise.resolve({
                skillId,
                filePath: reference.path,
                content: reference.content,
                bytes: Buffer.byteLength(reference.content, 'utf8'),
                sha256: (0, crypto_1.createHash)('sha256').update(reference.content).digest('hex'),
            });
        },
    };
}
function linkedFilesForSkill(skill) {
    return {
        references: (skill.references ?? []).map((reference) => ({
            path: reference.path,
            bytes: Buffer.byteLength(reference.content, 'utf8'),
            sha256: (0, crypto_1.createHash)('sha256').update(reference.content).digest('hex'),
        })),
        templates: [],
        scripts: [],
        assets: [],
        examples: [],
        other: [],
    };
}
async function resolveToolRef(ref, descriptors, options) {
    switch (ref.type) {
        case 'custom': {
            const descriptor = descriptors[ref.id];
            if (!descriptor) {
                throw new Error(`Custom tool "${ref.id}" not found in tool descriptors`);
            }
            const builtTool = {
                name: descriptor.name,
                description: descriptor.description,
                systemInstruction: descriptor.systemInstruction ?? undefined,
                inputSchema: descriptor.inputSchema ?? undefined,
                outputTrust: descriptor.outputTrust === 'untrusted' ? 'untrusted' : undefined,
                handler: async (input, ctx) => {
                    return await options.toolExecutor.executeTool(descriptor.name, input, {
                        resumeData: 'resumeData' in ctx ? ctx.resumeData : undefined,
                        parentTelemetry: ctx.parentTelemetry,
                    });
                },
                ...(descriptor.hasToMessage
                    ? {
                        toMessage: async (output) => await options.toolExecutor.executeToMessage(descriptor.name, output),
                    }
                    : {}),
                providerOptions: descriptor.providerOptions,
            };
            if (ref.requireApproval) {
                return (0, tool_1.wrapToolForApproval)(builtTool, { requireApproval: true });
            }
            return builtTool;
        }
        case 'workflow': {
            const marker = {
                name: ref.name ?? ref.workflow,
                description: ref.description ?? `Execute the "${ref.workflow}" workflow`,
                editable: false,
                metadata: {
                    workflowTool: true,
                    workflowName: ref.workflow,
                    options: { name: ref.name, description: ref.description },
                },
            };
            const resolved = await options.resolveTool?.(ref);
            if (resolved === null)
                return null;
            const tool = resolved ?? marker;
            if (ref.requireApproval) {
                return (0, tool_1.wrapToolForApproval)(tool, { requireApproval: true });
            }
            return tool;
        }
        case 'node': {
            const marker = {
                name: ref.name,
                description: ref.description ?? `Execute node ${ref.name}`,
                editable: false,
                metadata: { nodeTool: true, ...ref.node },
            };
            const resolved = await options.resolveTool?.(ref);
            if (resolved === null)
                return null;
            const tool = resolved ?? marker;
            if (ref.requireApproval) {
                return (0, tool_1.wrapToolForApproval)(tool, { requireApproval: true });
            }
            return tool;
        }
    }
}
async function applyMemoryFromConfig(agent, memoryConfig, memoryFactory, credentialProvider, resolveManagedEmbeddingProviderOptions) {
    const { Memory } = await import('@n8n/agents');
    const memory = new Memory();
    const builtMemory = memoryFactory(memoryConfig);
    memory.storage(await Promise.resolve(builtMemory));
    if (memoryConfig.episodicMemory?.enabled === true) {
        memory.episodicMemory(await resolveEpisodicMemoryJsonConfig(memoryConfig.episodicMemory, credentialProvider, resolveManagedEmbeddingProviderOptions));
    }
    if (memoryConfig.observationalMemory?.enabled !== false) {
        const observationalMemory = memoryConfig.observationalMemory;
        const { createObservationLogObserveFn, createObservationLogReflectFn } = await import('@n8n/agents');
        memory.observationalMemory({
            ...(observationalMemory?.observerModel !== undefined && {
                observe: createObservationLogObserveFn(await resolveMemoryWorkerModelConfig(observationalMemory.observerModel, credentialProvider)),
            }),
            ...(observationalMemory?.reflectorModel !== undefined && {
                reflect: createObservationLogReflectFn(await resolveMemoryWorkerModelConfig(observationalMemory.reflectorModel, credentialProvider)),
            }),
            ...(observationalMemory?.observerThresholdTokens !== undefined && {
                observerThresholdTokens: observationalMemory.observerThresholdTokens,
            }),
            ...(observationalMemory?.reflectorThresholdTokens !== undefined && {
                reflectorThresholdTokens: observationalMemory.reflectorThresholdTokens,
            }),
            ...(observationalMemory?.renderTokenBudget !== undefined && {
                renderTokenBudget: observationalMemory.renderTokenBudget,
            }),
            ...(observationalMemory?.observationLogTailLimit !== undefined && {
                observationLogTailLimit: observationalMemory.observationLogTailLimit,
            }),
            ...(observationalMemory?.lockTtlMs !== undefined && {
                lockTtlMs: observationalMemory.lockTtlMs,
            }),
        });
    }
    memory.titleGeneration({ sync: true });
    agent.memory(memory);
}
async function resolveEpisodicMemoryJsonConfig(config, credentialProvider, resolveManagedEmbeddingProviderOptions) {
    const { DEFAULT_EPISODIC_MEMORY_EMBEDDING_MODEL, createEpisodicMemoryReflectFn } = await import('@n8n/agents');
    const embeddingModel = DEFAULT_EPISODIC_MEMORY_EMBEDDING_MODEL;
    const embeddingProviderOptions = config.credential === api_types_1.MANAGED_CREDENTIAL_TOKEN
        ? await resolveManagedEmbeddingProviderOptions?.()
        : await (0, embedding_credential_1.resolveEmbeddingProviderOptionsFromCredential)(config.credential, embeddingModel, credentialProvider);
    if (!embeddingProviderOptions) {
        throw new Error('Managed Episodic Memory embeddings require the AI assistant proxy.');
    }
    return {
        enabled: true,
        ...(config.reflectorModel !== undefined && {
            reflect: createEpisodicMemoryReflectFn(await resolveMemoryWorkerModelConfig(config.reflectorModel, credentialProvider)),
        }),
        ...(config.topK !== undefined && { topK: config.topK }),
        ...(config.maxEntriesPerRun !== undefined && { maxEntriesPerRun: config.maxEntriesPerRun }),
        embeddingProviderOptions,
    };
}
async function resolveModelConfig(config, credentialProvider) {
    if (!config.credential)
        return config.model;
    return await (0, model_config_1.resolveCredentialAwareModelConfig)(config.model, config.credential, credentialProvider, config.modelDeploymentName);
}
async function resolveMemoryWorkerModelConfig(config, credentialProvider) {
    if (!config.credential)
        return config.model;
    return await (0, model_config_1.resolveCredentialAwareModelConfig)(config.model, config.credential, credentialProvider);
}
//# sourceMappingURL=from-json-config.js.map