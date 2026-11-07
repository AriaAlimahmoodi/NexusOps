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
var ChatHubWorkflowService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHubWorkflowService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const chat_hub_1 = require("@n8n/chat-hub");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const luxon_1 = require("luxon");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const uuid_1 = require("uuid");
const errors_1 = require("@n8n/errors");
const policy_enforcement_service_1 = require("../../policy/policy-enforcement.service");
const deprecated_nodes_validation_service_1 = require("../../workflows/deprecated-nodes-validation.service");
const workflow_finder_service_1 = require("../../workflows/workflow-finder.service");
const chat_hub_agent_repository_1 = require("./chat-hub-agent.repository");
const chat_hub_credentials_service_1 = require("./chat-hub-credentials.service");
const chat_hub_extractor_1 = require("./chat-hub-extractor");
const chat_hub_tool_service_1 = require("./chat-hub-tool.service");
const chat_hub_attachment_service_1 = require("./chat-hub.attachment.service");
const chat_hub_constants_1 = require("./chat-hub.constants");
const chat_hub_settings_service_1 = require("./chat-hub.settings.service");
const chat_hub_types_1 = require("./chat-hub.types");
const context_limits_1 = require("./context-limits");
const constants_1 = require("../../constants");
let ChatHubWorkflowService = ChatHubWorkflowService_1 = class ChatHubWorkflowService {
    constructor(logger, workflowRepository, sharedWorkflowRepository, chatHubAttachmentService, chatHubAgentRepository, chatHubSettingsService, chatHubCredentialsService, chatHubToolService, workflowFinderService, cipher, policyEnforcementService, deprecatedNodesValidationService) {
        this.logger = logger;
        this.workflowRepository = workflowRepository;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.chatHubAttachmentService = chatHubAttachmentService;
        this.chatHubAgentRepository = chatHubAgentRepository;
        this.chatHubSettingsService = chatHubSettingsService;
        this.chatHubCredentialsService = chatHubCredentialsService;
        this.chatHubToolService = chatHubToolService;
        this.workflowFinderService = workflowFinderService;
        this.cipher = cipher;
        this.policyEnforcementService = policyEnforcementService;
        this.deprecatedNodesValidationService = deprecatedNodesValidationService;
        this.logger = this.logger.scoped('chat-hub');
    }
    async deleteChatWorkflow(workflowId) {
        if (process.env.N8N_SKIP_CHAT_WORKFLOW_CLEANUP !== 'true') {
            await this.workflowRepository.delete(workflowId);
        }
    }
    async createChatWorkflow(userId, sessionId, projectId, history, humanMessage, attachments, credentials, model, systemMessage, tools, timeZone, vectorStoreSearch, executionMetadata, ctx = {}, providerSettings) {
        this.logger.debug(`Creating chat workflow for user ${userId} and session ${sessionId}, provider ${model.provider}`);
        const { nodes, connections, executionData } = await this.buildChatWorkflow({
            userId,
            sessionId,
            history,
            humanMessage,
            attachments,
            credentials,
            model,
            systemMessage: systemMessage ?? this.getBaseSystemMessage(history, timeZone),
            tools,
            vectorStoreSearch,
            executionMetadata,
            providerSettings,
        });
        const newWorkflow = new db_1.WorkflowEntity();
        newWorkflow.isArchived = true;
        newWorkflow.versionId = (0, uuid_1.v4)();
        newWorkflow.name = `Chat ${sessionId}`;
        newWorkflow.active = false;
        newWorkflow.activeVersionId = null;
        newWorkflow.nodes = nodes;
        newWorkflow.connections = connections;
        newWorkflow.settings = {
            executionOrder: 'v1',
        };
        const cleared = await this.enforceChatWorkflowSave(newWorkflow, projectId, { id: userId });
        return await this.workflowRepository.runInTransaction({ ...ctx, policyCleared: cleared }, async (em, txCtx) => {
            const workflow = await this.workflowRepository.createContent(newWorkflow, txCtx);
            await em.save(this.sharedWorkflowRepository.create({
                role: 'workflow:owner',
                projectId,
                workflow,
            }));
            return {
                workflowData: workflow,
                executionData,
                responseMode: 'streaming',
            };
        });
    }
    async enforceChatWorkflowSave(workflow, projectId, user) {
        this.deprecatedNodesValidationService.validateOnCreate(workflow.nodes, workflow.id);
        return await this.policyEnforcementService.enforceWorkflowSave({
            workflow: { id: workflow.id ?? null, name: workflow.name, nodes: workflow.nodes },
            storedWorkflow: null,
            projectId,
        }, { kind: 'user', user });
    }
    async createTitleGenerationWorkflow(userId, sessionId, projectId, humanMessage, attachments, credentials, model, ctx = {}, providerSettings) {
        this.logger.debug(`Creating title generation workflow for user ${userId} and session ${sessionId}, provider ${model.provider}`);
        const { nodes, connections, executionData } = this.buildTitleGenerationWorkflow(userId, sessionId, credentials, model, humanMessage, attachments, providerSettings);
        const newWorkflow = new db_1.WorkflowEntity();
        newWorkflow.isArchived = true;
        newWorkflow.versionId = (0, uuid_1.v4)();
        newWorkflow.name = `Chat ${sessionId} (Title Generation)`;
        newWorkflow.active = false;
        newWorkflow.activeVersionId = null;
        newWorkflow.nodes = nodes;
        newWorkflow.connections = connections;
        newWorkflow.settings = {
            executionOrder: 'v1',
            saveDataSuccessExecution: 'all',
        };
        const cleared = await this.enforceChatWorkflowSave(newWorkflow, projectId, { id: userId });
        return await this.workflowRepository.runInTransaction({ ...ctx, policyCleared: cleared }, async (em, txCtx) => {
            const workflow = await this.workflowRepository.createContent(newWorkflow, txCtx);
            await em.save(this.sharedWorkflowRepository.create({
                role: 'workflow:owner',
                projectId,
                workflow,
            }));
            return {
                workflowData: workflow,
                executionData,
            };
        });
    }
    parseInputModalities(options) {
        const allowFileUploads = options?.allowFileUploads ?? false;
        const allowedFilesMimeTypes = options?.allowedFilesMimeTypes;
        if (!allowFileUploads) {
            return ['text'];
        }
        if (!allowedFilesMimeTypes || this.allowsAllMimeTypes(allowedFilesMimeTypes)) {
            return ['text', 'image', 'audio', 'video', 'file'];
        }
        const mimeTypes = allowedFilesMimeTypes.split(',').map((type) => type.trim());
        const modalities = new Set(['text']);
        for (const mimeType of mimeTypes) {
            modalities.add(this.getMimeTypeModality(mimeType));
        }
        return Array.from(modalities);
    }
    resolveAllowedMimeTypes(options) {
        if (!options?.allowFileUploads) {
            return '';
        }
        const allowedFilesMimeTypes = options.allowedFilesMimeTypes;
        if (!allowedFilesMimeTypes || this.allowsAllMimeTypes(allowedFilesMimeTypes)) {
            return '*/*';
        }
        return allowedFilesMimeTypes;
    }
    allowsAllMimeTypes(allowedFilesMimeTypes) {
        return allowedFilesMimeTypes
            .split(',')
            .some((mimeType) => mimeType.trim() === '*' || mimeType.trim() === '*/*');
    }
    resolveWorkflowAttachmentPolicy(nodes) {
        const chatTrigger = nodes.find((node) => node.type === n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE);
        const chatTriggerParams = chat_hub_types_1.chatTriggerParamsShape.safeParse(chatTrigger?.parameters).data;
        const allowFileUploads = chatTriggerParams?.options?.allowFileUploads ?? false;
        return {
            allowFileUploads,
            allowedFilesMimeTypes: this.resolveAllowedMimeTypes(chatTriggerParams?.options),
        };
    }
    async getAttachmentPolicy(model, user, trx, manual) {
        if (model.provider === 'n8n') {
            const workflow = await this.workflowFinderService.findWorkflowForUser(model.workflowId, user, manual ? ['workflow:execute'] : ['workflow:execute-chat'], { includeTags: false, includeParentFolder: false, includeActiveVersion: !manual, em: trx });
            if (manual) {
                if (!workflow)
                    throw new errors_1.BadRequestError('Workflow not found');
                return this.resolveWorkflowAttachmentPolicy(workflow.nodes);
            }
            if (!workflow?.activeVersion) {
                throw new errors_1.BadRequestError('Workflow not found');
            }
            return this.resolveWorkflowAttachmentPolicy(workflow.activeVersion.nodes);
        }
        if (model.provider === 'custom-agent') {
            const agent = await this.chatHubAgentRepository.getOneById(model.agentId, user.id, trx);
            if (!agent?.provider || !agent.model) {
                throw new errors_1.BadRequestError('Agent not found or has no model configured');
            }
            const metadata = (0, chat_hub_constants_1.getModelMetadata)(agent.provider, agent.model);
            return {
                allowFileUploads: metadata.allowFileUploads,
                allowedFilesMimeTypes: metadata.allowedFilesMimeTypes,
            };
        }
        const metadata = (0, chat_hub_constants_1.getModelMetadata)(model.provider, model.model);
        return {
            allowFileUploads: metadata.allowFileUploads,
            allowedFilesMimeTypes: metadata.allowedFilesMimeTypes,
        };
    }
    getUniqueNodeName(originalName, existingNames) {
        if (!existingNames.has(originalName)) {
            return originalName;
        }
        let index = 1;
        let uniqueName = `${originalName}${index}`;
        while (existingNames.has(uniqueName)) {
            index++;
            uniqueName = `${originalName}${index}`;
        }
        return uniqueName;
    }
    async buildChatWorkflow({ userId, sessionId, history, humanMessage, attachments, credentials, model, systemMessage, tools, vectorStoreSearch, executionMetadata, providerSettings, }) {
        const chatTriggerNode = this.buildChatTriggerNode();
        const toolsAgentNode = this.buildToolsAgentNode(model, systemMessage);
        const modelNode = this.buildModelNode(credentials, model, providerSettings);
        const memoryNode = this.buildMemoryNode(providerSettings?.contextWindowLength ?? chat_hub_1.DEFAULT_CONTEXT_WINDOW_LENGTH);
        const restoreMemoryNode = await this.buildRestoreMemoryNode(history, model);
        const clearMemoryNode = this.buildClearMemoryNode();
        const mergeNode = this.buildMergeNode();
        const nodes = [
            chatTriggerNode,
            toolsAgentNode,
            modelNode,
            memoryNode,
            restoreMemoryNode,
            clearMemoryNode,
            mergeNode,
            ...(vectorStoreSearch
                ? this.buildVectorStoreNodes(vectorStoreSearch.agentId, vectorStoreSearch.options)
                : []),
        ];
        const nodeNames = new Set(nodes.map((node) => node.name));
        const distinctTools = tools.map((tool, i) => {
            const position = [
                700 + Math.floor(i / 3) * 60 + (i % 3) * 120,
                300 + Math.floor(i / 3) * 120 - (i % 3) * 30,
            ];
            const name = this.getUniqueNodeName(tool.name, nodeNames);
            nodeNames.add(name);
            return {
                ...tool,
                name,
                position,
            };
        });
        nodes.push.apply(nodes, distinctTools);
        const connections = {
            [chat_hub_constants_1.NODE_NAMES.CHAT_TRIGGER]: {
                [n8n_workflow_1.NodeConnectionTypes.Main]: [
                    [
                        { node: chat_hub_constants_1.NODE_NAMES.RESTORE_CHAT_MEMORY, type: n8n_workflow_1.NodeConnectionTypes.Main, index: 0 },
                        { node: chat_hub_constants_1.NODE_NAMES.MERGE, type: n8n_workflow_1.NodeConnectionTypes.Main, index: 0 },
                    ],
                ],
            },
            [chat_hub_constants_1.NODE_NAMES.RESTORE_CHAT_MEMORY]: {
                [n8n_workflow_1.NodeConnectionTypes.Main]: [
                    [{ node: chat_hub_constants_1.NODE_NAMES.MERGE, type: n8n_workflow_1.NodeConnectionTypes.Main, index: 1 }],
                ],
            },
            [chat_hub_constants_1.NODE_NAMES.MERGE]: {
                [n8n_workflow_1.NodeConnectionTypes.Main]: [
                    [{ node: chat_hub_constants_1.NODE_NAMES.REPLY_AGENT, type: n8n_workflow_1.NodeConnectionTypes.Main, index: 0 }],
                ],
            },
            [chat_hub_constants_1.NODE_NAMES.CHAT_MODEL]: {
                [n8n_workflow_1.NodeConnectionTypes.AiLanguageModel]: [
                    [{ node: chat_hub_constants_1.NODE_NAMES.REPLY_AGENT, type: n8n_workflow_1.NodeConnectionTypes.AiLanguageModel, index: 0 }],
                ],
            },
            [chat_hub_constants_1.NODE_NAMES.MEMORY]: {
                [n8n_workflow_1.NodeConnectionTypes.AiMemory]: [
                    [
                        { node: chat_hub_constants_1.NODE_NAMES.REPLY_AGENT, type: n8n_workflow_1.NodeConnectionTypes.AiMemory, index: 0 },
                        { node: chat_hub_constants_1.NODE_NAMES.RESTORE_CHAT_MEMORY, type: n8n_workflow_1.NodeConnectionTypes.AiMemory, index: 0 },
                        { node: chat_hub_constants_1.NODE_NAMES.CLEAR_CHAT_MEMORY, type: n8n_workflow_1.NodeConnectionTypes.AiMemory, index: 0 },
                    ],
                ],
            },
            [chat_hub_constants_1.NODE_NAMES.REPLY_AGENT]: {
                [n8n_workflow_1.NodeConnectionTypes.Main]: [
                    [
                        {
                            node: chat_hub_constants_1.NODE_NAMES.CLEAR_CHAT_MEMORY,
                            type: n8n_workflow_1.NodeConnectionTypes.Main,
                            index: 0,
                        },
                    ],
                ],
            },
            ...distinctTools.reduce((acc, tool) => {
                acc[tool.name] = {
                    [n8n_workflow_1.NodeConnectionTypes.AiTool]: [
                        [
                            {
                                node: chat_hub_constants_1.NODE_NAMES.REPLY_AGENT,
                                type: n8n_workflow_1.NodeConnectionTypes.AiTool,
                                index: 0,
                            },
                        ],
                    ],
                };
                return acc;
            }, {}),
            ...(vectorStoreSearch
                ? {
                    [chat_hub_constants_1.NODE_NAMES.EMBEDDINGS_MODEL]: {
                        [n8n_workflow_1.NodeConnectionTypes.AiEmbedding]: [
                            [
                                {
                                    node: chat_hub_constants_1.NODE_NAMES.VECTOR_STORE,
                                    type: n8n_workflow_1.NodeConnectionTypes.AiEmbedding,
                                    index: 0,
                                },
                            ],
                        ],
                    },
                    [chat_hub_constants_1.NODE_NAMES.VECTOR_STORE]: {
                        [n8n_workflow_1.NodeConnectionTypes.AiTool]: [
                            [
                                {
                                    node: chat_hub_constants_1.NODE_NAMES.REPLY_AGENT,
                                    type: n8n_workflow_1.NodeConnectionTypes.AiTool,
                                    index: 0,
                                },
                            ],
                        ],
                    },
                }
                : {}),
        };
        const nodeExecutionStack = await this.prepareExecutionData(chatTriggerNode, sessionId, humanMessage, attachments, executionMetadata);
        const executionData = (0, n8n_workflow_1.createRunExecutionData)({
            executionData: {
                nodeExecutionStack,
            },
            resultData: {
                metadata: ChatHubWorkflowService_1.buildHighlightedDataMetadata(chatTriggerNode.name, humanMessage, sessionId),
            },
            manualData: {
                userId,
            },
        });
        return { nodes, connections, executionData };
    }
    buildTitleGenerationWorkflow(userId, sessionId, credentials, model, humanMessage, attachments, providerSettings) {
        const chatTriggerNode = this.buildChatTriggerNode();
        const titleGeneratorAgentNode = this.buildTitleGeneratorAgentNode(humanMessage, attachments);
        const modelNode = this.buildModelNode(credentials, model, providerSettings);
        const nodes = [chatTriggerNode, titleGeneratorAgentNode, modelNode];
        const connections = {
            [chat_hub_constants_1.NODE_NAMES.CHAT_TRIGGER]: {
                [n8n_workflow_1.NodeConnectionTypes.Main]: [
                    [{ node: chat_hub_constants_1.NODE_NAMES.TITLE_GENERATOR_AGENT, type: n8n_workflow_1.NodeConnectionTypes.Main, index: 0 }],
                ],
            },
            [chat_hub_constants_1.NODE_NAMES.CHAT_MODEL]: {
                [n8n_workflow_1.NodeConnectionTypes.AiLanguageModel]: [
                    [
                        {
                            node: chat_hub_constants_1.NODE_NAMES.TITLE_GENERATOR_AGENT,
                            type: n8n_workflow_1.NodeConnectionTypes.AiLanguageModel,
                            index: 0,
                        },
                    ],
                ],
            },
        };
        const nodeExecutionStack = [
            {
                node: chatTriggerNode,
                data: {
                    [n8n_workflow_1.NodeConnectionTypes.Main]: [
                        [
                            {
                                json: {
                                    sessionId,
                                    action: 'sendMessage',
                                    chatInput: humanMessage,
                                },
                            },
                        ],
                    ],
                },
                source: null,
            },
        ];
        const executionData = (0, n8n_workflow_1.createRunExecutionData)({
            executionData: {
                nodeExecutionStack,
            },
            manualData: {
                userId,
            },
        });
        return { nodes, connections, executionData };
    }
    buildChatTriggerNode() {
        return {
            parameters: {},
            type: n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE,
            typeVersion: 1.4,
            position: [-448, -112],
            id: (0, uuid_1.v4)(),
            name: chat_hub_constants_1.NODE_NAMES.CHAT_TRIGGER,
            webhookId: (0, uuid_1.v4)(),
        };
    }
    getSystemMessageMetadata(timeZone) {
        if (constants_1.inE2ETests) {
            return '__e2e_system_prompt_placeholder__';
        }
        const now = luxon_1.DateTime.now();
        const isoTime = now.setZone(timeZone).toISO({ includeOffset: true });
        return `
# Current Date and Time

The user's current local date and time is: ${isoTime} (timezone: ${timeZone}).
When you need to reference "now", use this date and time.

# Output Capabilities

## Multimedia Generation

You are allowed to describe, explain and analyze provided multimedia data if you're capable of, but not allowed to create, generate, edit, or display images, videos, or other non-text content.
If the user asks you to generate or edit an image (or other media), explain that you are not able to do that and, if helpful, describe in words what the image could look like or how they could create it using external tools.

## Document Generation

You can create and edit documents for the user using special XML-like commands. When you use these commands, documents appear in a side panel next to this chat where users can view them in real-time. You can create multiple documents in a conversation, and users can switch between them using a dropdown selector.

Write these commands DIRECTLY in your response - do NOT wrap them in code fences or backticks.

### Creating a Document

To create a new document, include this command directly in your response:

<command:artifact-create>
<title>Document Title</title>
<type>md</type>
<content>
Document content here...
</content>
</command:artifact-create>

The type can be:
- html for HTML documents
- md for Markdown documents
- A code language like typescript, python, json, etc. for code files

Example response:
"I'll create an RFC document for you.

<command:artifact-create>
<title>RFC: New Feature</title>
<type>md</type>
<content>
# RFC: New Feature

## Summary
This feature will...
</content>
</command:artifact-create>

I've created the RFC above. Let me know if you'd like any changes!"

### Editing a Document

To make targeted edits to a document, you must specify the exact title of the document you want to edit:

<command:artifact-edit>
<title>Document Title</title>
<oldString>text to find</oldString>
<newString>replacement text</newString>
<replaceAll>false</replaceAll>
</command:artifact-edit>

- <title> is required and must match the exact title of an existing document.
- Set replaceAll to true to replace all occurrences, or false to replace only the first occurrence.
- If the document title doesn't exist, the edit command will be ignored.

IMPORTANT:
- Write these commands directly in your response text, NOT inside code blocks or fences.
- ALWAYS include conversational text before and/or after document commands. Never send a message with only commands and no explanation.
`;
    }
    getBaseSystemMessage(history, timeZone) {
        const artifactContext = this.buildArtifactContext(history);
        return `You are a helpful assistant.

${this.getSystemMessageMetadata(timeZone) + artifactContext}`;
    }
    buildToolsAgentNode(model, systemMessage, enableStreaming = true) {
        return {
            parameters: {
                promptType: 'define',
                text: `={{ $('${chat_hub_constants_1.NODE_NAMES.CHAT_TRIGGER}').item.json.chatInput }}`,
                options: {
                    enableStreaming,
                    maxTokensFromMemory: model.provider !== 'n8n' && model.provider !== 'custom-agent'
                        ? (0, context_limits_1.getMaxContextWindowTokens)(model.provider, model.model)
                        : undefined,
                    systemMessage,
                },
            },
            type: n8n_workflow_1.AGENT_LANGCHAIN_NODE_TYPE,
            typeVersion: 3,
            position: [608, 0],
            id: (0, uuid_1.v4)(),
            name: chat_hub_constants_1.NODE_NAMES.REPLY_AGENT,
        };
    }
    buildModelNode(credentials, conversationModel, providerSettings) {
        if (conversationModel.provider === 'n8n' || conversationModel.provider === 'custom-agent') {
            throw new n8n_workflow_1.OperationalError('Custom agent workflows do not require a model node');
        }
        const { provider, model } = conversationModel;
        const common = {
            position: [608, 304],
            id: (0, uuid_1.v4)(),
            name: chat_hub_constants_1.NODE_NAMES.CHAT_MODEL,
            credentials,
            type: chat_hub_constants_1.PROVIDER_NODE_TYPE_MAP[provider].name,
            typeVersion: chat_hub_constants_1.PROVIDER_NODE_TYPE_MAP[provider].version,
        };
        switch (provider) {
            case 'openai':
                return {
                    ...common,
                    parameters: {
                        model: { __rl: true, mode: 'id', value: model },
                        options: {
                            textFormat: {
                                textOptions: {
                                    type: 'text',
                                },
                            },
                        },
                        ...(providerSettings?.responsesApiEnabled === false
                            ? { responsesApiEnabled: false }
                            : {}),
                    },
                };
            case 'anthropic':
                return {
                    ...common,
                    parameters: {
                        model: {
                            __rl: true,
                            mode: 'id',
                            value: model,
                            cachedResultName: model,
                        },
                        options: {},
                    },
                };
            case 'google':
                return {
                    ...common,
                    parameters: {
                        model: { __rl: true, mode: 'id', value: model },
                        options: {},
                    },
                };
            case 'azureOpenAi':
            case 'azureEntraId':
                return {
                    ...common,
                    parameters: {
                        model,
                        options: {},
                    },
                };
            case 'ollama': {
                return {
                    ...common,
                    parameters: {
                        model,
                        options: {},
                    },
                };
            }
            case 'awsBedrock': {
                return {
                    ...common,
                    parameters: {
                        model,
                        options: {},
                    },
                };
            }
            case 'vercelAiGateway': {
                return {
                    ...common,
                    parameters: {
                        model,
                        options: {},
                    },
                };
            }
            case 'xAiGrok': {
                return {
                    ...common,
                    parameters: {
                        model,
                        options: {},
                    },
                };
            }
            case 'groq': {
                return {
                    ...common,
                    parameters: {
                        model,
                        options: {},
                    },
                };
            }
            case 'openRouter': {
                return {
                    ...common,
                    parameters: {
                        model,
                        options: {},
                    },
                };
            }
            case 'deepSeek': {
                return {
                    ...common,
                    parameters: {
                        model,
                        options: {},
                    },
                };
            }
            case 'cohere': {
                return {
                    ...common,
                    parameters: {
                        model,
                        options: {},
                    },
                };
            }
            case 'mistralCloud': {
                return {
                    ...common,
                    parameters: {
                        model,
                        options: {},
                    },
                };
            }
            case 'nvidia': {
                return {
                    ...common,
                    parameters: {
                        model,
                        options: {},
                    },
                };
            }
            default:
                throw new n8n_workflow_1.OperationalError('Unsupported model provider');
        }
    }
    buildMemoryNode(contextWindowLength) {
        return {
            parameters: {
                sessionIdType: 'customKey',
                sessionKey: `={{ $('${chat_hub_constants_1.NODE_NAMES.CHAT_TRIGGER}').item.json.sessionId }}`,
                contextWindowLength,
            },
            type: n8n_workflow_1.MEMORY_BUFFER_WINDOW_NODE_TYPE,
            typeVersion: 1.3,
            position: [224, 304],
            id: (0, uuid_1.v4)(),
            name: chat_hub_constants_1.NODE_NAMES.MEMORY,
        };
    }
    async buildRestoreMemoryNode(history, model) {
        const messageValues = await this.buildMessageValuesWithAttachments(history, model);
        return {
            parameters: {
                mode: 'insert',
                insertMode: 'override',
                messages: {
                    messageValues: messageValues,
                },
            },
            type: n8n_workflow_1.MEMORY_MANAGER_NODE_TYPE,
            typeVersion: 1.1,
            position: [-192, 48],
            id: (0, uuid_1.v4)(),
            name: chat_hub_constants_1.NODE_NAMES.RESTORE_CHAT_MEMORY,
        };
    }
    async buildMessageValuesWithAttachments(history, model) {
        const metadata = (0, chat_hub_constants_1.getModelMetadata)(model.provider, model.model);
        const maxTotalPayloadSize = 20 * 1024 * 1024 * 0.9;
        const typeMap = {
            human: 'user',
            ai: 'ai',
            system: 'system',
        };
        const messageValues = [];
        let currentTotalSize = 0;
        const messages = history.slice().reverse();
        for (const message of messages) {
            if (message.content.length === 0) {
                continue;
            }
            const attachments = message.attachments ?? [];
            const type = typeMap[message.type] || 'system';
            const textSize = message.content.length;
            currentTotalSize += textSize;
            if (attachments.length === 0) {
                messageValues.push({
                    type,
                    message: message.content,
                    hideFromUI: false,
                });
                continue;
            }
            const blocks = [{ type: 'text', text: message.content }];
            for (const attachment of attachments) {
                const block = await this.buildContentBlockForAttachment(attachment, currentTotalSize, maxTotalPayloadSize, metadata);
                blocks.push(block);
                currentTotalSize += block.type === 'text' ? block.text.length : block.image_url.length;
            }
            messageValues.push({
                type,
                message: blocks,
                hideFromUI: false,
            });
        }
        messageValues.reverse();
        return messageValues;
    }
    async buildContentBlockForAttachment(attachment, currentTotalSize, maxTotalPayloadSize, modelMetadata) {
        class TotalFileSizeExceededError extends Error {
        }
        class UnsupportedMimeTypeError extends Error {
        }
        try {
            if (currentTotalSize >= maxTotalPayloadSize) {
                throw new TotalFileSizeExceededError();
            }
            if (this.isTextFile(attachment.mimeType)) {
                const buffer = await this.chatHubAttachmentService.getAsBuffer(attachment);
                const content = buffer.toString('utf-8');
                if (currentTotalSize + content.length > maxTotalPayloadSize) {
                    throw new TotalFileSizeExceededError();
                }
                return {
                    type: 'text',
                    text: `File: ${attachment.fileName ?? 'attachment'}\nContent: \n${content}`,
                };
            }
            const modality = this.getMimeTypeModality(attachment.mimeType);
            if (!modelMetadata.inputModalities.includes(modality)) {
                throw new UnsupportedMimeTypeError();
            }
            const url = await this.chatHubAttachmentService.getDataUrl(attachment);
            if (currentTotalSize + url.length > maxTotalPayloadSize) {
                throw new TotalFileSizeExceededError();
            }
            return { type: 'image_url', image_url: url };
        }
        catch (e) {
            if (e instanceof TotalFileSizeExceededError) {
                return {
                    type: 'text',
                    text: `File: ${attachment.fileName ?? 'attachment'}\n(Content omitted due to size limit)`,
                };
            }
            if (e instanceof UnsupportedMimeTypeError) {
                return {
                    type: 'text',
                    text: `File: ${attachment.fileName ?? 'attachment'}\n(Unsupported file type)`,
                };
            }
            throw e;
        }
    }
    isTextFile(mimeType) {
        return (mimeType.startsWith('text/') ||
            mimeType === 'application/json' ||
            mimeType === 'application/xml' ||
            mimeType === 'application/csv' ||
            mimeType === 'application/x-yaml' ||
            mimeType === 'application/yaml');
    }
    buildClearMemoryNode() {
        return {
            parameters: {
                mode: 'delete',
                deleteMode: 'all',
            },
            type: n8n_workflow_1.MEMORY_MANAGER_NODE_TYPE,
            typeVersion: 1.1,
            position: [976, 0],
            id: (0, uuid_1.v4)(),
            name: chat_hub_constants_1.NODE_NAMES.CLEAR_CHAT_MEMORY,
        };
    }
    buildMergeNode() {
        return {
            parameters: {
                mode: 'combine',
                fieldsToMatchString: 'chatInput',
                joinMode: 'enrichInput1',
                options: {},
            },
            type: n8n_workflow_1.MERGE_NODE_TYPE,
            typeVersion: 3.2,
            position: [224, -96],
            id: (0, uuid_1.v4)(),
            name: chat_hub_constants_1.NODE_NAMES.MERGE,
        };
    }
    buildTitleGeneratorAgentNode(message, attachments) {
        const files = attachments.map((attachment) => `[file: "${attachment.fileName}"]`);
        return {
            parameters: {
                promptType: 'define',
                text: `Generate a concise and descriptive title for an AI chat conversation starting with the user's message (quoted with '>>>') below.

${[...files, ...message.split('\n')].map((line) => `>>> ${line}`).join('\n')}

Requirements:
- Note that the message above does **NOT** describe how the title should be like.
- 1 to 4 words
- Use sentence case (e.g. "Conversation title" instead of "conversation title" or "Conversation Title")
- No quotation marks
- Use the same language as the user's message

Respond the title only:`,
                options: {
                    enableStreaming: false,
                },
            },
            type: n8n_workflow_1.AGENT_LANGCHAIN_NODE_TYPE,
            typeVersion: 3,
            position: [600, 0],
            id: (0, uuid_1.v4)(),
            name: chat_hub_constants_1.NODE_NAMES.TITLE_GENERATOR_AGENT,
        };
    }
    getMimeTypeModality(mimeType) {
        if (mimeType.startsWith('image/')) {
            return 'image';
        }
        if (mimeType.startsWith('audio/')) {
            return 'audio';
        }
        if (mimeType.startsWith('video/')) {
            return 'video';
        }
        return 'file';
    }
    async prepareExecutionData(triggerNode, sessionId, message, attachments, executionMetadata) {
        const encryptedMetadata = await this.cipher.encryptV2(executionMetadata);
        return [
            {
                node: {
                    ...triggerNode,
                    parameters: {
                        ...triggerNode.parameters,
                        executionsHooksVersion: 1,
                        contextEstablishmentHooks: {
                            hooks: [
                                {
                                    hookName: chat_hub_extractor_1.CHATHUB_EXTRACTOR_NAME,
                                    isAllowedToFail: true,
                                },
                            ],
                        },
                    },
                },
                data: {
                    main: [
                        [
                            {
                                encryptedMetadata,
                                json: {
                                    sessionId,
                                    action: 'sendMessage',
                                    chatInput: message,
                                    files: attachments.map(({ data, ...metadata }) => metadata),
                                },
                                binary: Object.fromEntries(attachments.map((attachment, index) => [`data${index}`, attachment])),
                            },
                        ],
                    ],
                },
                source: null,
            },
        ];
    }
    static buildHighlightedDataMetadata(triggerNodeName, message, sessionId) {
        return {
            [(0, n8n_workflow_1.getHighlightedInputKey)(triggerNodeName)]: message,
            [n8n_workflow_1.HIGHLIGHTED_SESSION_KEY]: sessionId,
        };
    }
    async prepareReplyWorkflow(user, sessionId, credentials, model, history, message, tools, attachments, timeZone, ctx, executionMetadata, manual) {
        if (model.provider === 'n8n') {
            return await this.prepareWorkflowAgentWorkflow(user, sessionId, model.workflowId, message, attachments, ctx, executionMetadata, manual);
        }
        if (model.provider === 'custom-agent') {
            return await this.prepareChatAgentWorkflow(model.agentId, user, sessionId, history, message, attachments, timeZone, ctx, executionMetadata);
        }
        return await this.prepareBaseChatWorkflow(user, sessionId, credentials, model, history, message, undefined, tools, attachments, timeZone, null, ctx, executionMetadata);
    }
    async prepareBaseChatWorkflow(user, sessionId, credentials, model, history, message, systemMessage, tools, attachments, timeZone, vectorStoreSearch, ctx, executionMetadata) {
        return await this.workflowRepository.runInTransaction(ctx, async (trx, txCtx) => {
            await this.chatHubSettingsService.ensureModelIsAllowed(model, trx);
            this.chatHubCredentialsService.findProviderCredential(model.provider, credentials);
            const { id: projectId } = await this.chatHubCredentialsService.findPersonalProject(user, trx);
            const providerSettings = await this.chatHubSettingsService.getProviderSettings(model.provider, trx);
            return await this.createChatWorkflow(user.id, sessionId, projectId, history, message, attachments, credentials, model, systemMessage, this.filterAllowedTools(user, tools), timeZone, vectorStoreSearch, executionMetadata, txCtx, providerSettings);
        });
    }
    filterAllowedTools(user, tools) {
        const isChatUser = user.role.slug === 'global:chatUser';
        return tools.filter((tool) => {
            if ((0, api_types_1.isChatHubToolTypeAllowed)(tool.type, { isChatUser }))
                return true;
            this.logger.warn('Skipped a Chat Hub tool that the user is not allowed to run', {
                userId: user.id,
                toolType: tool.type,
            });
            return false;
        });
    }
    async prepareChatAgentWorkflow(agentId, user, sessionId, history, message, attachments, timeZone, ctx, executionMetadata) {
        return await this.workflowRepository.runInTransaction(ctx, async (trx, txCtx) => {
            return await this.prepareChatAgentWorkflowInTransaction(agentId, user, sessionId, history, message, attachments, timeZone, trx, txCtx, executionMetadata);
        });
    }
    async prepareChatAgentWorkflowInTransaction(agentId, user, sessionId, history, message, attachments, timeZone, trx, ctx, executionMetadata) {
        const agent = await this.chatHubAgentRepository.getOneById(agentId, user.id, trx);
        if (!agent) {
            throw new errors_1.BadRequestError('Agent not found');
        }
        if (!agent.provider || !agent.model) {
            throw new errors_1.BadRequestError('Provider or model not set for agent');
        }
        const credentialId = agent.credentialId;
        if (!credentialId) {
            throw new errors_1.BadRequestError('Credentials not set for agent');
        }
        const artifactContext = this.buildArtifactContext(history);
        const systemMessage = [
            'Combine provided tools and knowledge to answer questions.',
            this.getSystemMessageMetadata(timeZone) + artifactContext,
            this.buildCustomInstructionsContext(agent.systemPrompt),
            this.buildFileKnowledgeContext(agent.files),
        ]
            .filter(Boolean)
            .join('\n\n');
        const model = {
            provider: agent.provider,
            model: agent.model,
        };
        const credentials = {
            [api_types_1.PROVIDER_CREDENTIAL_TYPE_MAP[agent.provider]]: {
                id: credentialId,
                name: '',
            },
        };
        const tools = await this.chatHubToolService.getToolDefinitionsForAgent(agentId, trx);
        const semanticSearchOptions = await this.chatHubSettingsService.getSemanticSearchOptions();
        return await this.prepareBaseChatWorkflow(user, sessionId, credentials, model, history, message, systemMessage, tools, attachments, timeZone, agent.files.length > 0 && semanticSearchOptions
            ? { agentId: agent.id, options: semanticSearchOptions }
            : null, ctx, executionMetadata);
    }
    async prepareWorkflowAgentWorkflow(user, sessionId, workflowId, message, attachments, ctx, executionMetadata, manual) {
        return await this.workflowRepository.runInTransaction(ctx, async (trx) => await this.prepareWorkflowAgentWorkflowInTransaction(user, sessionId, workflowId, message, attachments, trx, executionMetadata, manual));
    }
    async prepareWorkflowAgentWorkflowInTransaction(user, sessionId, workflowId, message, attachments, trx, executionMetadata, manual) {
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, manual ? ['workflow:execute'] : ['workflow:execute-chat'], { includeTags: false, includeParentFolder: false, includeActiveVersion: !manual, em: trx });
        if (!workflow) {
            throw new errors_1.BadRequestError('Workflow not found');
        }
        if (!manual && !workflow.activeVersion) {
            throw new errors_1.BadRequestError('Workflow not found');
        }
        const workflowNodes = manual ? workflow.nodes : workflow.activeVersion.nodes;
        const workflowConnections = manual ? workflow.connections : workflow.activeVersion.connections;
        const chatTriggers = workflowNodes.filter((node) => node.type === n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE);
        if (chatTriggers.length !== 1) {
            throw new errors_1.BadRequestError('Workflow must have exactly one chat trigger');
        }
        const chatTrigger = chatTriggers[0];
        if (chatTrigger.typeVersion < chat_hub_constants_1.CHAT_TRIGGER_NODE_MIN_VERSION) {
            throw new errors_1.BadRequestError('Chat Trigger node version is too old to support Chat. Please update the node.');
        }
        const chatTriggerParams = chat_hub_types_1.chatTriggerParamsShape.safeParse(chatTrigger.parameters).data;
        if (!chatTriggerParams) {
            throw new errors_1.BadRequestError('Chat Trigger node has invalid parameters');
        }
        if (!chatTriggerParams.availableInChat) {
            throw new errors_1.BadRequestError('Chat Trigger node must be made available in Chat');
        }
        const responseMode = chatTriggerParams.options?.responseMode ?? 'streaming';
        if (!chat_hub_constants_1.SUPPORTED_RESPONSE_MODES.includes(responseMode)) {
            throw new errors_1.BadRequestError('Chat Trigger node response mode must be set to "When Last Node Finishes", "Using Response Nodes" or "Streaming" to use the workflow on Chat');
        }
        const chatResponseNodes = workflowNodes.filter((node) => node.type === n8n_workflow_1.CHAT_NODE_TYPE);
        if (chatResponseNodes.length > 0 && responseMode !== 'responseNodes') {
            throw new errors_1.BadRequestError('Chat nodes are not supported with the selected response mode. Please set the response mode to "Using Response Nodes" or remove the nodes from the workflow.');
        }
        const agentNodes = workflowNodes.filter((node) => node.type === n8n_workflow_1.AGENT_LANGCHAIN_NODE_TYPE);
        if (agentNodes.some((node) => node.typeVersion < chat_hub_constants_1.TOOLS_AGENT_NODE_MIN_VERSION)) {
            throw new errors_1.BadRequestError('Agent node version is too old to support streaming responses. Please update the node.');
        }
        const nodeExecutionStack = await this.prepareExecutionData(chatTrigger, sessionId, message, attachments, executionMetadata);
        const autoSaveHighlightedData = chatTriggerParams.options?.autoSaveHighlightedData !== false;
        const executionData = (0, n8n_workflow_1.createRunExecutionData)({
            executionData: {
                nodeExecutionStack,
            },
            resultData: autoSaveHighlightedData
                ? {
                    metadata: ChatHubWorkflowService_1.buildHighlightedDataMetadata(chatTrigger.name, message, sessionId),
                }
                : undefined,
            manualData: {
                userId: user.id,
            },
        });
        const workflowData = {
            ...workflow,
            nodes: workflowNodes,
            connections: workflowConnections,
            pinData: manual ? (workflow.pinData ?? undefined) : undefined,
            settings: {
                ...workflow.settings,
                saveDataSuccessExecution: 'all',
            },
        };
        return {
            workflowData,
            executionData,
            responseMode,
        };
    }
    buildCustomInstructionsContext(systemPrompt) {
        if (!systemPrompt.trim()) {
            return '';
        }
        return `## Instructions from the user

${systemPrompt
            .split('\n')
            .map((line) => `> ${line}`)
            .join('\n')}`;
    }
    buildFileKnowledgeContext(knowledgeItems) {
        if (knowledgeItems.length === 0) {
            return '';
        }
        const fileList = knowledgeItems.map((f) => `- ${f.fileName}`).join('\n');
        return `## Context Files

You have access to the following user-uploaded files as a searchable context for the conversation:

${fileList}

Use context_files_search tool to search these documents when answering questions that may be related to them.
Do not proactively mention these files to the user.
When you use information from these files, always cite the source using markdown footnote syntax (e.g. "Some fact.[^1]" with "[^1]: example.pdf, page 3" at the end of your response).`;
    }
    buildArtifactContext(history) {
        const artifacts = (0, chat_hub_1.collectChatArtifacts)(history.flatMap(chat_hub_1.parseMessage));
        if (artifacts.length === 0) {
            return '';
        }
        const artifactsText = artifacts
            .map((artifact, index) => `

### Document ${index + 1}: ${artifact.title} (type: ${artifact.type})

${artifact.content}
`)
            .join('\n');
        return `

## Current Documents

${artifactsText}

You can update the most recent document using the commands described above, or create a new document.`;
    }
    buildVectorStoreNodes(agentId, options) {
        const embeddingsModelNode = this.buildEmbeddingsModelNode(options);
        const vectorStoreNode = this.buildVectorStoreNode(agentId, options);
        return [embeddingsModelNode, vectorStoreNode];
    }
    buildEmbeddingsModelNode({ embeddingModel: embedding }) {
        const embeddingsNodeType = chat_hub_1.EMBEDDINGS_NODE_TYPE_MAP[embedding.provider];
        if (!embeddingsNodeType) {
            throw new errors_1.BadRequestError(`Embeddings are not supported for provider '${embedding.provider}'. Please configure an embedding provider for this agent.`);
        }
        const credentialType = api_types_1.PROVIDER_CREDENTIAL_TYPE_MAP[embedding.provider];
        return {
            parameters: {
                options: {},
            },
            type: embeddingsNodeType.name,
            typeVersion: embeddingsNodeType.version,
            position: [800, 720],
            id: (0, uuid_1.v4)(),
            name: chat_hub_constants_1.NODE_NAMES.EMBEDDINGS_MODEL,
            credentials: {
                [credentialType]: {
                    id: embedding.credentialId,
                    name: credentialType,
                },
            },
        };
    }
    buildVectorStoreNode(agentId, settings) {
        return {
            parameters: {
                mode: 'retrieve-as-tool',
                toolName: 'context_files_search',
                toolDescription: 'Use this tool to query context files',
                options: {
                    metadata: {
                        metadataValues: [{ name: 'agentId', value: agentId }],
                    },
                },
            },
            type: settings.vectorStore.nodeType,
            typeVersion: 1,
            position: [800, 496],
            id: (0, uuid_1.v4)(),
            name: 'Vector Store',
            credentials: {
                [settings.vectorStore.credentialType]: {
                    id: settings.vectorStore.credentialId,
                    name: '',
                },
            },
        };
    }
    async createEmbeddingsInsertionWorkflow(user, projectId, attachments, agentId, vectorStoreSearch, ctx, workflowId) {
        const triggerNode = {
            parameters: {
                options: {
                    allowFileUploads: true,
                },
            },
            type: n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE,
            typeVersion: 1.4,
            position: [-48, 0],
            id: (0, uuid_1.v4)(),
            name: chat_hub_constants_1.NODE_NAMES.CHAT_TRIGGER,
            webhookId: (0, uuid_1.v4)(),
        };
        const embeddingsNode = {
            ...this.buildEmbeddingsModelNode(vectorStoreSearch),
            position: [128, 464],
            name: chat_hub_constants_1.NODE_NAMES.EMBEDDINGS_MODEL,
        };
        const nodes = [
            {
                parameters: {
                    mode: 'insert',
                },
                type: vectorStoreSearch.vectorStore.nodeType,
                typeVersion: 1,
                position: [208, 0],
                id: (0, uuid_1.v4)(),
                name: chat_hub_constants_1.NODE_NAMES.VECTOR_STORE,
                credentials: {
                    [vectorStoreSearch.vectorStore.credentialType]: {
                        id: vectorStoreSearch.vectorStore.credentialId,
                        name: '',
                    },
                },
            },
            triggerNode,
            embeddingsNode,
            {
                parameters: {
                    dataType: 'binary',
                    options: {
                        splitPages: true,
                        metadata: {
                            metadataValues: [
                                {
                                    name: 'fileName',
                                    value: '={{ $binary.data.fileName }}',
                                },
                                {
                                    name: 'agentId',
                                    value: agentId,
                                },
                                {
                                    name: 'fileKnowledgeId',
                                    value: '={{ $json.knowledgeId }}',
                                },
                            ],
                        },
                    },
                },
                type: n8n_workflow_1.DOCUMENT_DEFAULT_DATA_LOADER_NODE_TYPE,
                typeVersion: 1.1,
                position: [320, 192],
                id: (0, uuid_1.v4)(),
                name: chat_hub_constants_1.NODE_NAMES.DEFAULT_DATA_LOADER,
            },
        ];
        const connections = {
            [chat_hub_constants_1.NODE_NAMES.VECTOR_STORE]: {
                main: [[]],
            },
            [chat_hub_constants_1.NODE_NAMES.CHAT_TRIGGER]: {
                main: [
                    [
                        {
                            node: chat_hub_constants_1.NODE_NAMES.VECTOR_STORE,
                            type: 'main',
                            index: 0,
                        },
                    ],
                ],
            },
            [chat_hub_constants_1.NODE_NAMES.EMBEDDINGS_MODEL]: {
                ai_embedding: [
                    [
                        {
                            node: chat_hub_constants_1.NODE_NAMES.VECTOR_STORE,
                            type: 'ai_embedding',
                            index: 0,
                        },
                    ],
                ],
            },
            [chat_hub_constants_1.NODE_NAMES.DEFAULT_DATA_LOADER]: {
                ai_document: [
                    [
                        {
                            node: chat_hub_constants_1.NODE_NAMES.VECTOR_STORE,
                            type: 'ai_document',
                            index: 0,
                        },
                    ],
                ],
            },
        };
        const items = attachments.map(({ attachment, knowledgeId }) => ({
            json: {
                sessionId: (0, uuid_1.v4)(),
                action: 'sendMessage',
                chatInput: '',
                knowledgeId,
                files: [{ ...attachment, data: undefined }],
            },
            binary: {
                data: attachment,
            },
        }));
        const nodeExecutionStack = [
            {
                node: triggerNode,
                data: {
                    main: [items],
                },
                source: null,
            },
        ];
        const newWorkflow = new db_1.WorkflowEntity();
        newWorkflow.isArchived = true;
        newWorkflow.id = workflowId;
        newWorkflow.versionId = (0, uuid_1.v4)();
        newWorkflow.name = `Chat files insertion ${(0, uuid_1.v4)()}`;
        newWorkflow.active = false;
        newWorkflow.activeVersionId = null;
        newWorkflow.nodes = nodes;
        newWorkflow.connections = connections;
        newWorkflow.settings = {
            executionOrder: 'v1',
        };
        const cleared = await this.enforceChatWorkflowSave(newWorkflow, projectId, user);
        return await this.workflowRepository.runInTransaction({ ...ctx, policyCleared: cleared }, async (em, txCtx) => {
            const workflow = await this.workflowRepository.createContent(newWorkflow, txCtx);
            await em.save(this.sharedWorkflowRepository.create({
                role: 'workflow:owner',
                projectId,
                workflow,
            }));
            return {
                workflowData: workflow,
                executionData: (0, n8n_workflow_1.createRunExecutionData)({
                    executionData: {
                        nodeExecutionStack,
                    },
                    manualData: {
                        userId: user.id,
                    },
                }),
            };
        });
    }
};
exports.ChatHubWorkflowService = ChatHubWorkflowService;
exports.ChatHubWorkflowService = ChatHubWorkflowService = ChatHubWorkflowService_1 = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.WorkflowRepository, db_1.SharedWorkflowRepository, chat_hub_attachment_service_1.ChatHubAttachmentService, chat_hub_agent_repository_1.ChatHubAgentRepository, chat_hub_settings_service_1.ChatHubSettingsService, chat_hub_credentials_service_1.ChatHubCredentialsService, chat_hub_tool_service_1.ChatHubToolService, workflow_finder_service_1.WorkflowFinderService, n8n_core_1.Cipher, policy_enforcement_service_1.PolicyEnforcementService, deprecated_nodes_validation_service_1.DeprecatedNodesValidationService])
], ChatHubWorkflowService);
//# sourceMappingURL=chat-hub-workflow.service.js.map