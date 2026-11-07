import { LicenseState } from '@n8n/backend-common';
import { ContextEstablishmentOptions, ContextEstablishmentResult, HookDescription, IContextEstablishmentHook } from '@n8n/decorators';
import { InstanceRedactionEnforcementService } from './instance-redaction-enforcement.service';
export declare class RedactionContextHook implements IContextEstablishmentHook {
    private readonly instanceRedactionEnforcementService;
    private readonly licenseState;
    constructor(instanceRedactionEnforcementService: InstanceRedactionEnforcementService, licenseState: LicenseState);
    hookDescription: HookDescription;
    isApplicableToTriggerNode(_nodeType: string): boolean;
    execute(options: ContextEstablishmentOptions): Promise<ContextEstablishmentResult>;
}
