import type { AiGatewayConfigDto, AiGatewayUsageResponse, AiGatewayWalletResponse } from '@n8n/api-types';
import { AiChatRequestDto, AiApplySuggestionRequestDto, AiAskRequestDto, AiFreeCreditsRequestDto, AiBuilderChatRequestDto, AiSessionRetrievalRequestDto, AiUsageSettingsRequestDto, AiTruncateMessagesRequestDto, AiClearSessionRequestDto, AiGatewayUsageQueryDto } from '@n8n/api-types';
import { GlobalConfig } from '@n8n/config';
import { AuthenticatedRequest } from '@n8n/db';
import { type AiAssistantSDK } from '@n8n_io/ai-assistant-sdk';
import { Response } from 'express';
import { AiGatewayService } from '../services/ai-gateway.service';
import { AiUsageService } from '../services/ai-usage.service';
import { WorkflowBuilderService } from '../services/ai-workflow-builder.service';
import { AiService } from '../services/ai.service';
import { FreeAiCreditsService } from '../services/free-ai-credits.service';
export type FlushableResponse = Response & {
    flush: () => void;
};
export declare class AiController {
    private readonly aiService;
    private readonly workflowBuilderService;
    private readonly freeAiCreditsService;
    private readonly aiUsageService;
    private readonly aiGatewayService;
    private readonly globalConfig;
    constructor(aiService: AiService, workflowBuilderService: WorkflowBuilderService, freeAiCreditsService: FreeAiCreditsService, aiUsageService: AiUsageService, aiGatewayService: AiGatewayService, globalConfig: GlobalConfig);
    private toAiAssistantResponseError;
    private toResponseError;
    build(req: AuthenticatedRequest, res: FlushableResponse, payload: AiBuilderChatRequestDto): Promise<void>;
    chat(req: AuthenticatedRequest, res: FlushableResponse, payload: AiChatRequestDto): Promise<void>;
    applySuggestion(req: AuthenticatedRequest, _: Response, payload: AiApplySuggestionRequestDto): Promise<AiAssistantSDK.ApplySuggestionResponse>;
    askAi(req: AuthenticatedRequest, _: Response, payload: AiAskRequestDto): Promise<AiAssistantSDK.AskAiResponsePayload>;
    aiCredits(req: AuthenticatedRequest, _: Response, payload: AiFreeCreditsRequestDto): Promise<{
        id: string;
        generateId(): void;
        createdAt: Date;
        updatedAt: Date;
        setUpdateDate(): void;
        name: string;
        description: string | null;
        data: string;
        type: string;
        isManaged: boolean;
        isGlobal: boolean;
        isResolvable: boolean;
        resolvableAllowFallback: boolean;
        resolverId: string | null;
        usageScope: import("@n8n/db").CredentialUsageScope;
        pendingAuthorizationExpiresAt: Date | null;
        scopes: import("@n8n/permissions").Scope[];
    }>;
    getSessions(req: AuthenticatedRequest, _: Response, payload: AiSessionRetrievalRequestDto): Promise<{
        sessions: import("@n8n/ai-workflow-builder").Session[];
    }>;
    getGatewayConfig(): Promise<AiGatewayConfigDto>;
    getGatewayWallet(req: AuthenticatedRequest): Promise<AiGatewayWalletResponse>;
    getGatewayUsage(req: AuthenticatedRequest, _: Response, query: AiGatewayUsageQueryDto): Promise<AiGatewayUsageResponse>;
    getBuilderCredits(req: AuthenticatedRequest, _: Response): Promise<AiAssistantSDK.BuilderInstanceCreditsResponse>;
    truncateMessages(req: AuthenticatedRequest, _: Response, payload: AiTruncateMessagesRequestDto): Promise<{
        success: boolean;
    }>;
    clearSession(req: AuthenticatedRequest, _: Response, payload: AiClearSessionRequestDto): Promise<{
        success: boolean;
    }>;
    updateUsageSettings(_req: AuthenticatedRequest, _res: Response, payload: AiUsageSettingsRequestDto): Promise<void>;
}
