import { Logger } from '@n8n/backend-common';
import { type ContextEstablishmentOptions, type ContextEstablishmentResult, type HookDescription, type IContextEstablishmentHook } from '@n8n/decorators';
export declare class SlackSignatureExtractor implements IContextEstablishmentHook {
    private readonly logger;
    constructor(logger: Logger);
    hookDescription: HookDescription;
    isApplicableToTriggerNode(nodeType: string): boolean;
    execute(options: ContextEstablishmentOptions): Promise<ContextEstablishmentResult>;
    private getHeader;
    private getRawBody;
}
