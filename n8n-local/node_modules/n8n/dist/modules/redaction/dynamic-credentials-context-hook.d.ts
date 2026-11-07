import { Logger } from '@n8n/backend-common';
import { CredentialsRepository } from '@n8n/db';
import { ContextEstablishmentOptions, ContextEstablishmentResult, HookDescription, IContextEstablishmentHook } from '@n8n/decorators';
import { ExecutingUserIdentifierProxy } from '@n8n/backend-services';
export declare class DynamicCredentialsContextHook implements IContextEstablishmentHook {
    private readonly logger;
    private readonly credentialsRepository;
    private readonly executingUserIdentifierProxy;
    constructor(logger: Logger, credentialsRepository: CredentialsRepository, executingUserIdentifierProxy: ExecutingUserIdentifierProxy);
    hookDescription: HookDescription;
    isApplicableToTriggerNode(_nodeType: string): boolean;
    execute(options: ContextEstablishmentOptions): Promise<ContextEstablishmentResult>;
}
