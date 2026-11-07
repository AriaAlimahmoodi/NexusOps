import { ChatHubConversationModel, ChatSessionId, type ChatHubBaseLLMModel, type ChatProviderSettingsDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { OperationContext } from '@n8n/db';
import { SharedWorkflowRepository, User, WorkflowRepository } from '@n8n/db';
import { EntityManager } from '@n8n/typeorm';
import { Cipher } from 'n8n-core';
import { IExecuteData, INode, INodeCredentials, IRunExecutionData, IWorkflowBase, type IBinaryData } from 'n8n-workflow';
import { PolicyEnforcementService } from '../../policy/policy-enforcement.service';
import { DeprecatedNodesValidationService } from '../../workflows/deprecated-nodes-validation.service';
import { WorkflowFinderService } from '../../workflows/workflow-finder.service';
import { ChatHubAgentRepository } from './chat-hub-agent.repository';
import { ChatHubCredentialsService } from './chat-hub-credentials.service';
import { ChatHubAuthenticationMetadata } from './chat-hub-extractor';
import { ChatHubMessage } from './chat-hub-message.entity';
import { ChatHubToolService } from './chat-hub-tool.service';
import { ChatHubAttachmentService } from './chat-hub.attachment.service';
import { type ChatHubInputModality } from './chat-hub.constants';
import { ChatHubSettingsService } from './chat-hub.settings.service';
import { PreparedChatWorkflow, type ChatTriggerResponseMode, type SemanticSearchOptions } from './chat-hub.types';
export declare class ChatHubWorkflowService {
    private readonly logger;
    private readonly workflowRepository;
    private readonly sharedWorkflowRepository;
    private readonly chatHubAttachmentService;
    private readonly chatHubAgentRepository;
    private readonly chatHubSettingsService;
    private readonly chatHubCredentialsService;
    private readonly chatHubToolService;
    private readonly workflowFinderService;
    private readonly cipher;
    private readonly policyEnforcementService;
    private readonly deprecatedNodesValidationService;
    constructor(logger: Logger, workflowRepository: WorkflowRepository, sharedWorkflowRepository: SharedWorkflowRepository, chatHubAttachmentService: ChatHubAttachmentService, chatHubAgentRepository: ChatHubAgentRepository, chatHubSettingsService: ChatHubSettingsService, chatHubCredentialsService: ChatHubCredentialsService, chatHubToolService: ChatHubToolService, workflowFinderService: WorkflowFinderService, cipher: Cipher, policyEnforcementService: PolicyEnforcementService, deprecatedNodesValidationService: DeprecatedNodesValidationService);
    deleteChatWorkflow(workflowId: string): Promise<void>;
    createChatWorkflow(userId: string, sessionId: ChatSessionId, projectId: string, history: ChatHubMessage[], humanMessage: string, attachments: IBinaryData[], credentials: INodeCredentials, model: ChatHubBaseLLMModel, systemMessage: string | undefined, tools: INode[], timeZone: string, vectorStoreSearch: {
        agentId: string;
        options: SemanticSearchOptions;
    } | null, executionMetadata: ChatHubAuthenticationMetadata, ctx?: OperationContext, providerSettings?: ChatProviderSettingsDto): Promise<{
        workflowData: IWorkflowBase;
        executionData: IRunExecutionData;
        responseMode: ChatTriggerResponseMode;
    }>;
    private enforceChatWorkflowSave;
    createTitleGenerationWorkflow(userId: string, sessionId: ChatSessionId, projectId: string, humanMessage: string, attachments: IBinaryData[], credentials: INodeCredentials, model: ChatHubConversationModel, ctx?: OperationContext, providerSettings?: ChatProviderSettingsDto): Promise<{
        workflowData: IWorkflowBase;
        executionData: IRunExecutionData;
    }>;
    parseInputModalities(options?: {
        allowFileUploads?: boolean;
        allowedFilesMimeTypes?: string;
    }): ChatHubInputModality[];
    resolveAllowedMimeTypes(options?: {
        allowFileUploads?: boolean;
        allowedFilesMimeTypes?: string;
    }): string;
    private allowsAllMimeTypes;
    resolveWorkflowAttachmentPolicy(nodes: INode[]): {
        allowFileUploads: boolean;
        allowedFilesMimeTypes: string;
    };
    getAttachmentPolicy(model: ChatHubConversationModel, user: User, trx: EntityManager, manual?: boolean): Promise<{
        allowFileUploads: boolean;
        allowedFilesMimeTypes: string;
    }>;
    private getUniqueNodeName;
    private buildChatWorkflow;
    private buildTitleGenerationWorkflow;
    private buildChatTriggerNode;
    getSystemMessageMetadata(timeZone: string): string;
    private getBaseSystemMessage;
    private buildToolsAgentNode;
    private buildModelNode;
    private buildMemoryNode;
    private buildRestoreMemoryNode;
    private buildMessageValuesWithAttachments;
    private buildContentBlockForAttachment;
    private isTextFile;
    private buildClearMemoryNode;
    private buildMergeNode;
    private buildTitleGeneratorAgentNode;
    private getMimeTypeModality;
    prepareExecutionData(triggerNode: INode, sessionId: string, message: string, attachments: IBinaryData[], executionMetadata: ChatHubAuthenticationMetadata): Promise<IExecuteData[]>;
    private static buildHighlightedDataMetadata;
    prepareReplyWorkflow(user: User, sessionId: ChatSessionId, credentials: INodeCredentials, model: ChatHubConversationModel, history: ChatHubMessage[], message: string, tools: INode[], attachments: IBinaryData[], timeZone: string, ctx: OperationContext, executionMetadata: ChatHubAuthenticationMetadata, manual?: boolean): Promise<PreparedChatWorkflow>;
    private prepareBaseChatWorkflow;
    private filterAllowedTools;
    private prepareChatAgentWorkflow;
    private prepareChatAgentWorkflowInTransaction;
    private prepareWorkflowAgentWorkflow;
    private prepareWorkflowAgentWorkflowInTransaction;
    private buildCustomInstructionsContext;
    private buildFileKnowledgeContext;
    private buildArtifactContext;
    private buildVectorStoreNodes;
    private buildEmbeddingsModelNode;
    private buildVectorStoreNode;
    createEmbeddingsInsertionWorkflow(user: User, projectId: string, attachments: Array<{
        attachment: IBinaryData;
        knowledgeId: string;
    }>, agentId: string, vectorStoreSearch: SemanticSearchOptions, ctx: OperationContext, workflowId: string): Promise<{
        workflowData: IWorkflowBase;
        executionData: IRunExecutionData;
    }>;
}
