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
exports.ChatHubModelsService = void 0;
const api_types_1 = require("@n8n/api-types");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const backend_services_1 = require("@n8n/backend-services");
const dynamic_node_parameters_service_1 = require("../../services/dynamic-node-parameters.service");
const workflow_execute_additional_data_1 = require("../../workflow-execute-additional-data");
const workflow_service_1 = require("../../workflows/workflow.service");
const chat_hub_agent_service_1 = require("./chat-hub-agent.service");
const chat_hub_workflow_service_1 = require("./chat-hub-workflow.service");
const chat_hub_constants_1 = require("./chat-hub.constants");
const chat_hub_types_1 = require("./chat-hub.types");
let ChatHubModelsService = class ChatHubModelsService {
    constructor(nodeParametersService, workflowService, workflowRepository, credentialsFinderService, chatHubAgentService, chatHubWorkflowService) {
        this.nodeParametersService = nodeParametersService;
        this.workflowService = workflowService;
        this.workflowRepository = workflowRepository;
        this.credentialsFinderService = credentialsFinderService;
        this.chatHubAgentService = chatHubAgentService;
        this.chatHubWorkflowService = chatHubWorkflowService;
    }
    async getModels(user, credentialIds) {
        const additionalData = await (0, workflow_execute_additional_data_1.getBase)({ userId: user.id });
        const providers = api_types_1.chatHubProviderSchema.options;
        const allCredentials = await this.credentialsFinderService.findCredentialsForUser(user, [
            'credential:read',
        ]);
        const responses = await Promise.all(providers.map(async (provider) => {
            const credentials = {};
            if (provider !== 'n8n' && provider !== 'custom-agent') {
                const credentialId = credentialIds[provider];
                if (!credentialId) {
                    return [provider, { models: [] }];
                }
                if (!allCredentials.some((credential) => credential.id === credentialId)) {
                    return [
                        provider,
                        { models: [], error: 'Could not retrieve models. Verify credentials.' },
                    ];
                }
                credentials[api_types_1.PROVIDER_CREDENTIAL_TYPE_MAP[provider]] = { name: '', id: credentialId };
            }
            try {
                return [
                    provider,
                    await this.fetchModelsForProvider(user, provider, credentials, additionalData),
                ];
            }
            catch {
                return [
                    provider,
                    { models: [], error: 'Could not retrieve models. Verify credentials.' },
                ];
            }
        }));
        return responses.reduce((acc, [provider, res]) => {
            acc[provider] = res;
            return acc;
        }, { ...api_types_1.emptyChatModelsResponse });
    }
    async fetchModelsForProvider(user, provider, credentials, additionalData) {
        switch (provider) {
            case 'openai': {
                const rawModels = await this.fetchOpenAiModels(credentials, additionalData);
                return { models: this.transformAndFilterModels(rawModels, 'openai') };
            }
            case 'anthropic': {
                const rawModels = await this.fetchAnthropicModels(credentials, additionalData);
                return { models: this.transformAndFilterModels(rawModels, 'anthropic') };
            }
            case 'google': {
                const rawModels = await this.fetchGoogleModels(credentials, additionalData);
                return { models: this.transformAndFilterModels(rawModels, 'google') };
            }
            case 'ollama': {
                const rawModels = await this.fetchOllamaModels(credentials, additionalData);
                return { models: this.transformAndFilterModels(rawModels, 'ollama') };
            }
            case 'azureOpenAi': {
                const rawModels = this.fetchAzureOpenAiModels(credentials, additionalData);
                return { models: this.transformAndFilterModels(rawModels, 'azureOpenAi') };
            }
            case 'azureEntraId': {
                const rawModels = this.fetchAzureEntraIdModels(credentials, additionalData);
                return { models: this.transformAndFilterModels(rawModels, 'azureEntraId') };
            }
            case 'awsBedrock': {
                const rawModels = await this.fetchAwsBedrockModels(credentials, additionalData);
                return { models: this.transformAndFilterModels(rawModels, 'awsBedrock') };
            }
            case 'vercelAiGateway': {
                const rawModels = await this.fetchVercelAiGatewayModels(credentials, additionalData);
                return { models: this.transformAndFilterModels(rawModels, 'vercelAiGateway') };
            }
            case 'xAiGrok': {
                const rawModels = await this.fetchXAiGrokModels(credentials, additionalData);
                return { models: this.transformAndFilterModels(rawModels, 'xAiGrok') };
            }
            case 'groq': {
                const rawModels = await this.fetchGroqModels(credentials, additionalData);
                return { models: this.transformAndFilterModels(rawModels, 'groq') };
            }
            case 'openRouter': {
                const rawModels = await this.fetchOpenRouterModels(credentials, additionalData);
                return { models: this.transformAndFilterModels(rawModels, 'openRouter') };
            }
            case 'deepSeek': {
                const rawModels = await this.fetchDeepSeekModels(credentials, additionalData);
                return { models: this.transformAndFilterModels(rawModels, 'deepSeek') };
            }
            case 'cohere': {
                const rawModels = await this.fetchCohereModels(credentials, additionalData);
                return { models: this.transformAndFilterModels(rawModels, 'cohere') };
            }
            case 'mistralCloud': {
                const rawModels = await this.fetchMistralCloudModels(credentials, additionalData);
                return { models: this.transformAndFilterModels(rawModels, 'mistralCloud') };
            }
            case 'nvidia': {
                const rawModels = await this.fetchNvidiaModels(credentials, additionalData);
                return { models: this.transformAndFilterModels(rawModels, 'nvidia') };
            }
            case 'n8n':
                return { models: await this.fetchAgentWorkflowsAsModels(user) };
            case 'custom-agent':
                return { models: await this.chatHubAgentService.getAgentsByUserIdAsModels(user.id) };
        }
    }
    async fetchOpenAiModels(credentials, additionalData) {
        const resourceLocatorResults = await this.nodeParametersService.getResourceLocatorResults('searchModels', 'parameters.model', additionalData, chat_hub_constants_1.PROVIDER_NODE_TYPE_MAP.openai, {}, credentials);
        return resourceLocatorResults.results;
    }
    async fetchAnthropicModels(credentials, additionalData) {
        const resourceLocatorResults = await this.nodeParametersService.getResourceLocatorResults('searchModels', 'parameters.model', additionalData, chat_hub_constants_1.PROVIDER_NODE_TYPE_MAP.anthropic, {}, credentials);
        return resourceLocatorResults.results;
    }
    async fetchGoogleModels(credentials, additionalData) {
        return await this.nodeParametersService.getOptionsViaLoadOptions({
            routing: {
                request: {
                    method: 'GET',
                    url: '/v1beta/models',
                },
                output: {
                    postReceive: [
                        {
                            type: 'rootProperty',
                            properties: {
                                property: 'models',
                            },
                        },
                        {
                            type: 'filter',
                            properties: {
                                pass: "={{ !$responseItem.name.includes('embedding') }}",
                            },
                        },
                        {
                            type: 'setKeyValue',
                            properties: {
                                name: '={{$responseItem.name}}',
                                value: '={{$responseItem.name}}',
                                description: '={{$responseItem.description}}',
                            },
                        },
                        {
                            type: 'sort',
                            properties: {
                                key: 'name',
                            },
                        },
                    ],
                },
            },
        }, additionalData, chat_hub_constants_1.PROVIDER_NODE_TYPE_MAP.google, {}, credentials);
    }
    async fetchOllamaModels(credentials, additionalData) {
        return await this.nodeParametersService.getOptionsViaLoadOptions({
            routing: {
                request: {
                    method: 'GET',
                    url: '/api/tags',
                },
                output: {
                    postReceive: [
                        {
                            type: 'rootProperty',
                            properties: {
                                property: 'models',
                            },
                        },
                        {
                            type: 'setKeyValue',
                            properties: {
                                name: '={{$responseItem.name}}',
                                value: '={{$responseItem.name}}',
                            },
                        },
                        {
                            type: 'sort',
                            properties: {
                                key: 'name',
                            },
                        },
                    ],
                },
            },
        }, additionalData, chat_hub_constants_1.PROVIDER_NODE_TYPE_MAP.ollama, {}, credentials);
    }
    fetchAzureOpenAiModels(_credentials, _additionalData) {
        return [];
    }
    fetchAzureEntraIdModels(_credentials, _additionalData) {
        return [];
    }
    async fetchAwsBedrockModels(credentials, additionalData) {
        return await this.nodeParametersService.getOptionsViaMethodName('listModels', '', additionalData, chat_hub_constants_1.PROVIDER_NODE_TYPE_MAP.awsBedrock, {}, credentials);
    }
    async fetchNvidiaModels(credentials, additionalData) {
        return await this.nodeParametersService.getOptionsViaLoadOptions({
            routing: {
                request: {
                    method: 'GET',
                    url: '/models',
                },
                output: {
                    postReceive: [
                        {
                            type: 'rootProperty',
                            properties: {
                                property: 'data',
                            },
                        },
                        {
                            type: 'filter',
                            properties: {
                                pass: '={{ /nemotron/i.test($responseItem.id) }}',
                            },
                        },
                        {
                            type: 'setKeyValue',
                            properties: {
                                name: '={{$responseItem.id}}',
                                value: '={{$responseItem.id}}',
                            },
                        },
                        {
                            type: 'sort',
                            properties: {
                                key: 'name',
                            },
                        },
                    ],
                },
            },
        }, additionalData, chat_hub_constants_1.PROVIDER_NODE_TYPE_MAP.nvidia, {}, credentials);
    }
    async fetchMistralCloudModels(credentials, additionalData) {
        return await this.nodeParametersService.getOptionsViaLoadOptions({
            routing: {
                request: {
                    method: 'GET',
                    url: '/models',
                },
                output: {
                    postReceive: [
                        {
                            type: 'rootProperty',
                            properties: {
                                property: 'data',
                            },
                        },
                        {
                            type: 'filter',
                            properties: {
                                pass: "={{ !$responseItem.id.includes('embed') }}",
                            },
                        },
                        {
                            type: 'setKeyValue',
                            properties: {
                                name: '={{ $responseItem.id }}',
                                value: '={{ $responseItem.id }}',
                            },
                        },
                        {
                            type: 'sort',
                            properties: {
                                key: 'name',
                            },
                        },
                    ],
                },
            },
        }, additionalData, chat_hub_constants_1.PROVIDER_NODE_TYPE_MAP.mistralCloud, {}, credentials);
    }
    async fetchCohereModels(credentials, additionalData) {
        return await this.nodeParametersService.getOptionsViaLoadOptions({
            routing: {
                request: {
                    method: 'GET',
                    url: '/v1/models?page_size=100&endpoint=chat',
                },
                output: {
                    postReceive: [
                        {
                            type: 'rootProperty',
                            properties: {
                                property: 'models',
                            },
                        },
                        {
                            type: 'setKeyValue',
                            properties: {
                                name: '={{$responseItem.name}}',
                                value: '={{$responseItem.name}}',
                                description: '={{$responseItem.description}}',
                            },
                        },
                        {
                            type: 'sort',
                            properties: {
                                key: 'name',
                            },
                        },
                    ],
                },
            },
        }, additionalData, chat_hub_constants_1.PROVIDER_NODE_TYPE_MAP.cohere, {}, credentials);
    }
    async fetchDeepSeekModels(credentials, additionalData) {
        return await this.nodeParametersService.getOptionsViaLoadOptions({
            routing: {
                request: {
                    method: 'GET',
                    url: '/models',
                },
                output: {
                    postReceive: [
                        {
                            type: 'rootProperty',
                            properties: {
                                property: 'data',
                            },
                        },
                        {
                            type: 'setKeyValue',
                            properties: {
                                name: '={{$responseItem.id}}',
                                value: '={{$responseItem.id}}',
                            },
                        },
                        {
                            type: 'sort',
                            properties: {
                                key: 'name',
                            },
                        },
                    ],
                },
            },
        }, additionalData, chat_hub_constants_1.PROVIDER_NODE_TYPE_MAP.deepSeek, {}, credentials);
    }
    async fetchOpenRouterModels(credentials, additionalData) {
        return await this.nodeParametersService.getOptionsViaLoadOptions({
            routing: {
                request: {
                    method: 'GET',
                    url: '/models',
                },
                output: {
                    postReceive: [
                        {
                            type: 'rootProperty',
                            properties: {
                                property: 'data',
                            },
                        },
                        {
                            type: 'setKeyValue',
                            properties: {
                                name: '={{$responseItem.id}}',
                                value: '={{$responseItem.id}}',
                            },
                        },
                        {
                            type: 'sort',
                            properties: {
                                key: 'name',
                            },
                        },
                    ],
                },
            },
        }, additionalData, chat_hub_constants_1.PROVIDER_NODE_TYPE_MAP.openRouter, {}, credentials);
    }
    async fetchGroqModels(credentials, additionalData) {
        return await this.nodeParametersService.getOptionsViaLoadOptions({
            routing: {
                request: {
                    method: 'GET',
                    url: '/models',
                },
                output: {
                    postReceive: [
                        {
                            type: 'rootProperty',
                            properties: {
                                property: 'data',
                            },
                        },
                        {
                            type: 'filter',
                            properties: {
                                pass: '={{ $responseItem.active === true && $responseItem.object === "model" }}',
                            },
                        },
                        {
                            type: 'setKeyValue',
                            properties: {
                                name: '={{$responseItem.id}}',
                                value: '={{$responseItem.id}}',
                            },
                        },
                    ],
                },
            },
        }, additionalData, chat_hub_constants_1.PROVIDER_NODE_TYPE_MAP.groq, {}, credentials);
    }
    async fetchXAiGrokModels(credentials, additionalData) {
        return await this.nodeParametersService.getOptionsViaLoadOptions({
            routing: {
                request: {
                    method: 'GET',
                    url: '/models',
                },
                output: {
                    postReceive: [
                        {
                            type: 'rootProperty',
                            properties: {
                                property: 'data',
                            },
                        },
                        {
                            type: 'setKeyValue',
                            properties: {
                                name: '={{$responseItem.id}}',
                                value: '={{$responseItem.id}}',
                            },
                        },
                        {
                            type: 'sort',
                            properties: {
                                key: 'name',
                            },
                        },
                    ],
                },
            },
        }, additionalData, chat_hub_constants_1.PROVIDER_NODE_TYPE_MAP.xAiGrok, {}, credentials);
    }
    async fetchVercelAiGatewayModels(credentials, additionalData) {
        return await this.nodeParametersService.getOptionsViaLoadOptions({
            routing: {
                request: {
                    method: 'GET',
                    url: '/models',
                },
                output: {
                    postReceive: [
                        {
                            type: 'rootProperty',
                            properties: {
                                property: 'data',
                            },
                        },
                        {
                            type: 'setKeyValue',
                            properties: {
                                name: '={{$responseItem.id}}',
                                value: '={{$responseItem.id}}',
                            },
                        },
                        {
                            type: 'sort',
                            properties: {
                                key: 'name',
                            },
                        },
                    ],
                },
            },
        }, additionalData, chat_hub_constants_1.PROVIDER_NODE_TYPE_MAP.vercelAiGateway, {}, credentials);
    }
    async fetchAgentWorkflowsAsModels(user) {
        const workflowsWithChatTrigger = await this.workflowService.getWorkflowsWithNodesIncluded(user, [n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE], true);
        const activeWorkflows = workflowsWithChatTrigger
            .filter((workflow) => workflow.scopes.includes('workflow:execute-chat'))
            .filter((workflow) => !!workflow.activeVersionId);
        if (activeWorkflows.length === 0) {
            return [];
        }
        const workflows = await this.workflowRepository.find({
            select: {
                id: true,
                name: true,
                shared: {
                    role: true,
                    project: {
                        id: true,
                        name: true,
                        type: true,
                        icon: { type: true, value: true },
                    },
                },
            },
            where: { id: (0, db_1.In)(activeWorkflows.map((workflow) => workflow.id)) },
            relations: {
                activeVersion: true,
                shared: {
                    project: true,
                },
            },
        });
        return workflows.flatMap((workflow) => {
            const scopes = activeWorkflows.find((w) => w.id === workflow.id)?.scopes ?? [];
            const model = this.extractModelFromWorkflow(workflow, scopes);
            return model ? [model] : [];
        });
    }
    extractModelFromWorkflow({ name, activeVersion, id, shared }, scopes) {
        if (!activeVersion) {
            return null;
        }
        const chatTrigger = activeVersion.nodes?.find((node) => node.type === n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE);
        if (!chatTrigger) {
            return null;
        }
        const chatTriggerParams = chat_hub_types_1.chatTriggerParamsShape.safeParse(chatTrigger.parameters).data;
        if (!chatTriggerParams?.availableInChat) {
            return null;
        }
        const { allowFileUploads, allowedFilesMimeTypes } = this.chatHubWorkflowService.resolveWorkflowAttachmentPolicy(activeVersion.nodes ?? []);
        const agentName = chatTriggerParams.agentName && chatTriggerParams.agentName.trim().length > 0
            ? chatTriggerParams.agentName
            : name;
        const suggestedPrompts = this.parseSuggestedPrompts(chatTriggerParams.suggestedPrompts);
        const { groupName, groupIcon } = this.resolveOwnerProject(shared);
        return {
            name: agentName,
            description: chatTriggerParams.agentDescription ?? null,
            icon: chatTriggerParams.agentIcon ?? null,
            model: {
                provider: 'n8n',
                workflowId: id,
            },
            createdAt: activeVersion.createdAt ? activeVersion.createdAt.toISOString() : null,
            updatedAt: activeVersion.updatedAt ? activeVersion.updatedAt.toISOString() : null,
            metadata: {
                allowFileUploads,
                allowedFilesMimeTypes,
                capabilities: {
                    functionCalling: false,
                },
                available: true,
                scopes,
            },
            groupName,
            groupIcon,
            ...(suggestedPrompts.length > 0 ? { suggestedPrompts } : {}),
        };
    }
    parseSuggestedPrompts(raw) {
        return (raw?.prompts
            ?.filter((p) => p.text.trim().length > 0)
            .map((p) => ({ text: p.text, ...(p.icon ? { icon: p.icon } : {}) })) ?? []);
    }
    resolveOwnerProject(shared) {
        const ownerProject = shared?.find((sw) => sw.role === 'workflow:owner')?.project;
        return {
            groupName: ownerProject?.type === 'personal' ? null : (ownerProject?.name ?? null),
            groupIcon: ownerProject?.icon ?? null,
        };
    }
    transformAndFilterModels(rawModels, provider) {
        const seen = new Set();
        return rawModels.flatMap((model) => {
            const id = String(model.value);
            const metadata = (0, chat_hub_constants_1.getModelMetadata)(provider, id);
            if (!metadata.available)
                return [];
            if (seen.has(id))
                return [];
            seen.add(id);
            return [
                {
                    id,
                    name: model.name,
                    description: model.description ?? null,
                    icon: null,
                    model: {
                        provider,
                        model: id,
                    },
                    createdAt: null,
                    updatedAt: null,
                    metadata,
                    groupName: null,
                    groupIcon: null,
                },
            ];
        });
    }
};
exports.ChatHubModelsService = ChatHubModelsService;
exports.ChatHubModelsService = ChatHubModelsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [dynamic_node_parameters_service_1.DynamicNodeParametersService, workflow_service_1.WorkflowService, db_1.WorkflowRepository, backend_services_1.CredentialsFinderService, chat_hub_agent_service_1.ChatHubAgentService, chat_hub_workflow_service_1.ChatHubWorkflowService])
], ChatHubModelsService);
//# sourceMappingURL=chat-hub.models.service.js.map