import type { InstanceAiVerificationResponse, InstanceAiVerifyModelRequest, InstanceAiVerifySandboxRequest, InstanceAiVerifySearchRequest } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import { GlobalConfig } from '@n8n/config';
import type { User } from '@n8n/db';
import { Telemetry } from '../../telemetry';
import { InstanceAiModelService } from './instance-ai-model.service';
import { InstanceAiSettingsService } from './instance-ai-settings.service';
export declare class InstanceAiVerificationService {
    private readonly logger;
    private readonly globalConfig;
    private readonly settingsService;
    private readonly modelService;
    private readonly outboundHttp;
    private readonly telemetry;
    constructor(logger: Logger, globalConfig: GlobalConfig, settingsService: InstanceAiSettingsService, modelService: InstanceAiModelService, outboundHttp: OutboundHttp, telemetry: Telemetry);
    verifyModel(user: User, request: InstanceAiVerifyModelRequest): Promise<InstanceAiVerificationResponse>;
    verifySandbox(user: User, request: InstanceAiVerifySandboxRequest): Promise<InstanceAiVerificationResponse>;
    verifySearch(request: InstanceAiVerifySearchRequest): Promise<InstanceAiVerificationResponse>;
    private logVerificationFailure;
    private resolveSandboxConfig;
}
