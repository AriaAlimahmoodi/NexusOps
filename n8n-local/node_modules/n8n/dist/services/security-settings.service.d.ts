import type { RedactionFloor } from '@n8n/api-types';
import { EventService, RoleService } from '@n8n/backend-services';
import { SettingsRepository, SharedCredentialsRepository, SharedWorkflowRepository, WorkflowRepository } from '@n8n/db';
import { PERSONAL_SPACE_PUBLISHING_SETTING, PERSONAL_SPACE_SHARING_SETTING } from '@n8n/permissions';
import type { DistributiveOmit } from '@n8n/utils/types';
import type { RelayEventMap, UserLike } from '../events/maps/relay.event-map';
import { InstanceRedactionEnforcementService } from '../modules/redaction/instance-redaction-enforcement.service';
export interface SecurityPolicyUpdate {
    personalSpacePublishing?: boolean;
    personalSpaceSharing?: boolean;
    redactionEnforcement?: {
        floor: RedactionFloor;
    };
}
export interface SecurityPolicyReadResult {
    personalSpacePublishing: boolean;
    personalSpaceSharing: boolean;
    publishedPersonalWorkflowsCount: number;
    sharedPersonalWorkflowsCount: number;
    sharedPersonalCredentialsCount: number;
    redactionEnforcement: {
        floor: RedactionFloor;
    };
}
type InstancePolicyUpdate = DistributiveOmit<RelayEventMap['instance-policies-updated'], 'user'>;
export declare class SecuritySettingsService {
    private readonly settingsRepository;
    private readonly roleService;
    private readonly workflowRepository;
    private readonly sharedWorkflowRepository;
    private readonly sharedCredentialsRepository;
    private readonly instanceRedactionEnforcementService;
    private readonly eventService;
    private readonly PERSONAL_OWNER_ROLE_SLUG;
    constructor(settingsRepository: SettingsRepository, roleService: RoleService, workflowRepository: WorkflowRepository, sharedWorkflowRepository: SharedWorkflowRepository, sharedCredentialsRepository: SharedCredentialsRepository, instanceRedactionEnforcementService: InstanceRedactionEnforcementService, eventService: EventService);
    getSecuritySettings(): Promise<SecurityPolicyReadResult>;
    updateSecuritySettings(securityPolicyUpdate: SecurityPolicyUpdate, actor: UserLike): Promise<SecurityPolicyUpdate>;
    emitInstancePolicyUpdated(actor: UserLike, update: InstancePolicyUpdate): void;
    setPersonalSpaceSetting(setting: typeof PERSONAL_SPACE_PUBLISHING_SETTING | typeof PERSONAL_SPACE_SHARING_SETTING, enabled: boolean): Promise<void>;
    arePersonalSpaceSettingsEnabled(): Promise<{
        personalSpacePublishing: boolean;
        personalSpaceSharing: boolean;
    }>;
    getPublishedPersonalWorkflowsCount(): Promise<number>;
    getSharedPersonalWorkflowsCount(): Promise<number>;
    getSharedPersonalCredentialsCount(): Promise<number>;
    private toEventUser;
}
export {};
