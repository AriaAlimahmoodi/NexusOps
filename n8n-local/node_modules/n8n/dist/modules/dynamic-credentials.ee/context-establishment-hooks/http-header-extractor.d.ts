import { Logger } from '@n8n/backend-common';
import { ContextEstablishmentOptions, ContextEstablishmentResult, HookDescription, IContextEstablishmentHook } from '@n8n/decorators';
export declare class HttpHeaderExtractor implements IContextEstablishmentHook {
    private readonly logger;
    constructor(logger: Logger);
    hookDescription: HookDescription;
    isApplicableToTriggerNode(nodeType: string): boolean;
    execute(options: ContextEstablishmentOptions): Promise<ContextEstablishmentResult>;
}
