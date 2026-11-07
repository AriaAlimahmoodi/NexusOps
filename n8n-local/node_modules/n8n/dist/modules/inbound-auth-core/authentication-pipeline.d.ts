import { Logger } from '@n8n/backend-common';
import { AuthenticationService, AuthenticationPipeline, type Extracted, IdentityService, type Result } from '@n8n/inbound-auth';
import type { SecurityContext } from '@n8n/permissions';
export declare class InboundAuthPipeline extends AuthenticationPipeline {
    private readonly logger;
    private readonly authenticationService;
    private readonly identityService;
    constructor(logger: Logger, authenticationService: AuthenticationService, identityService: IdentityService);
    run(extracted: Extracted): Promise<Result<SecurityContext>>;
    private reject;
}
