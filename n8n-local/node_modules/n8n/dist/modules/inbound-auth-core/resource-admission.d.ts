import { Logger } from '@n8n/backend-common';
import { AuthenticationPipeline, AuthenticationService, ResourceAdmission, type AdmissionResult, type Extracted, type Inbound, type ProtectedResource, type Refused } from '@n8n/inbound-auth';
export declare class InboundResourceAdmission extends ResourceAdmission {
    private readonly pipeline;
    private readonly authenticationService;
    private readonly logger;
    constructor(pipeline: AuthenticationPipeline, authenticationService: AuthenticationService, logger: Logger);
    admitBearer(resource: ProtectedResource, request: Omit<Inbound['request'], 'headers'>, token: string): Promise<AdmissionResult>;
    admit(resource: ProtectedResource, extracted: Extracted): Promise<AdmissionResult>;
    challenge({ advertised, reason }: Refused): Promise<string>;
    private refuse;
}
