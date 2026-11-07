import { ContextEstablishmentOptions, ContextEstablishmentResult, HookDescription, IContextEstablishmentHook } from '@n8n/decorators';
import { HttpHeaderExtractor } from './http-header-extractor';
export declare class BearerTokenExtractor implements IContextEstablishmentHook {
    private readonly httpHeaderExtractor;
    constructor(httpHeaderExtractor: HttpHeaderExtractor);
    hookDescription: HookDescription;
    isApplicableToTriggerNode(nodeType: string): boolean;
    execute(options: ContextEstablishmentOptions): Promise<ContextEstablishmentResult>;
}
