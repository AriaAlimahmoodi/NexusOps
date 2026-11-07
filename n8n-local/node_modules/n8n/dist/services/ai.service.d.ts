import type { AiApplySuggestionRequestDto, AiAskRequestDto, AiChatRequestDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { AiAssistantClient } from '@n8n_io/ai-assistant-sdk';
import { ErrorReporter, InstanceSettings } from 'n8n-core';
import { type IUser } from 'n8n-workflow';
import { License } from '../license';
export declare class AiService {
    private readonly licenseService;
    private readonly globalConfig;
    private readonly instanceSettings;
    private readonly logger;
    private readonly errorReporter;
    private client;
    private initPromise;
    constructor(licenseService: License, globalConfig: GlobalConfig, instanceSettings: InstanceSettings, logger: Logger, errorReporter: ErrorReporter);
    init(): Promise<void>;
    chat(payload: AiChatRequestDto, user: IUser): Promise<Response>;
    applySuggestion(payload: AiApplySuggestionRequestDto, user: IUser): Promise<import("@n8n_io/ai-assistant-sdk").AiAssistantSDK.ApplySuggestionResponse>;
    askAi(payload: AiAskRequestDto, user: IUser): Promise<import("@n8n_io/ai-assistant-sdk").AiAssistantSDK.AskAiResponsePayload>;
    isProxyEnabled(): boolean;
    getClient(): Promise<AiAssistantClient>;
    createFreeAiCredits(user: IUser): Promise<import("@n8n_io/ai-assistant-sdk").AiAssistantSDK.AiCreditResponsePayload>;
}
