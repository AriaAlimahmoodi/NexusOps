import type { MigrationNotifyResult } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { UrlService } from '@n8n/backend-services';
import { UserRepository, type User } from '@n8n/db';
import { UserManagementMailer } from '../../../user-management/email/user-management-mailer';
import { RuleRegistry } from '../breaking-changes.rule-registry.service';
import { MigrationFindingRepository } from '../database/repositories/migration-finding.repository';
import { MigrationWorkflowOwnerRepository } from '../database/repositories/migration-workflow-owner.repository';
export declare class MigrationFindingNotificationService {
    private readonly ruleRegistry;
    private readonly findingRepository;
    private readonly ownerRepository;
    private readonly userRepository;
    private readonly mailer;
    private readonly urlService;
    private readonly logger;
    constructor(ruleRegistry: RuleRegistry, findingRepository: MigrationFindingRepository, ownerRepository: MigrationWorkflowOwnerRepository, userRepository: UserRepository, mailer: UserManagementMailer, urlService: UrlService, logger: Logger);
    notifyOwners(ruleId: string, workflowIds: string[], notifier: User): Promise<MigrationNotifyResult>;
    private groupByOwner;
}
