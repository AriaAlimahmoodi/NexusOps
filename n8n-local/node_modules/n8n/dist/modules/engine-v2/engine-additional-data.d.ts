import { SsrfProtectionService } from '@n8n/backend-network';
import { EventService, UrlService } from '@n8n/backend-services';
import { GlobalConfig, SsrfProtectionConfig } from '@n8n/config';
import type { AdditionalDataContext } from '@n8n/node-engine-compatibility';
import type { ICredentialsHelper, IWorkflowExecuteAdditionalData } from 'n8n-workflow';
export declare class EngineAdditionalDataBuilder {
    private readonly urlService;
    private readonly globalConfig;
    private readonly eventService;
    private readonly ssrfProtectionConfig;
    private readonly ssrfProtectionService;
    constructor(urlService: UrlService, globalConfig: GlobalConfig, eventService: EventService, ssrfProtectionConfig: SsrfProtectionConfig, ssrfProtectionService: SsrfProtectionService);
    build(context: AdditionalDataContext, credentialsHelper: ICredentialsHelper): IWorkflowExecuteAdditionalData;
}
