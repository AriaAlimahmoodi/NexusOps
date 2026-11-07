import { ContextEstablishmentOptions, ContextEstablishmentResult, HookDescription, IContextEstablishmentHook } from '@n8n/decorators';
import { RuntimeCredentialsService } from './runtime-credentials.service';
export declare class RuntimeCredentialsContextHook implements IContextEstablishmentHook {
    private readonly runtimeCredentialsService;
    constructor(runtimeCredentialsService: RuntimeCredentialsService);
    hookDescription: HookDescription;
    isApplicableToTriggerNode(_nodeType: string): boolean;
    execute(options: ContextEstablishmentOptions): Promise<ContextEstablishmentResult>;
}
