import { Logger } from '@n8n/backend-common';
import { UserRepository } from '@n8n/db';
import { TrustedSourceGate } from '@n8n/inbound-auth';
import { WorkflowFinderService } from '../../workflows/workflow-finder.service';
import { TrustedSourceIdentityRepository } from './database/repositories/trusted-source-identity.repository';
export declare class TrustedSourceDbGate extends TrustedSourceGate {
    private readonly logger;
    private readonly userRepository;
    private readonly workflowFinderService;
    private readonly identityRepository;
    constructor(logger: Logger, userRepository: UserRepository, workflowFinderService: WorkflowFinderService, identityRepository: TrustedSourceIdentityRepository);
    authorizeSealed({ userId, grant, binding, }: Parameters<TrustedSourceGate['authorizeSealed']>[0]): Promise<boolean>;
}
