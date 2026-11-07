import type { FrontendSettings } from '@n8n/api-types';
import { LicenseState, Logger, ModuleRegistry } from '@n8n/backend-common';
import { GlobalConfig, SecurityConfig } from '@n8n/config';
import { WorkflowRepository } from '@n8n/db';
import { BinaryDataConfig, InstanceSettings } from 'n8n-core';
import type { INodeTypeDescription } from 'n8n-workflow';
import { UrlService } from '@n8n/backend-services';
import { AiUsageService } from './ai-usage.service';
import { WorkflowReviewPolicyService } from './workflow-review-policy.service';
import { CredentialTypes } from '../credential-types';
import { CredentialsOverwrites } from '../credentials-overwrites';
import { License } from '../license';
import { LoadNodesAndCredentials } from '../load-nodes-and-credentials';
import { MfaService } from '../mfa/mfa.service';
import { InboxService } from '../modules/inbox/inbox.service';
import { PushConfig } from '../push/push.config';
import { OwnershipService } from '../services/ownership.service';
import { UserManagementMailer } from '../user-management/email';
export type PublicFrontendSettings = {
    settingsMode: FrontendSettings['settingsMode'];
    defaultLocale: FrontendSettings['defaultLocale'];
    previewMode: FrontendSettings['previewMode'];
    authCookie: {
        secure: FrontendSettings['authCookie']['secure'];
    };
    userManagement: {
        authenticationMethod: FrontendSettings['userManagement']['authenticationMethod'];
        showSetupOnFirstLoad: FrontendSettings['userManagement']['showSetupOnFirstLoad'];
        smtpSetup: FrontendSettings['userManagement']['smtpSetup'];
        passwordMinLength: FrontendSettings['userManagement']['passwordMinLength'];
    };
    enterprise: {
        saml: FrontendSettings['enterprise']['saml'];
        oidc: FrontendSettings['enterprise']['oidc'];
        ldap: FrontendSettings['enterprise']['ldap'];
    };
    sso: {
        saml: {
            loginEnabled: FrontendSettings['sso']['saml']['loginEnabled'];
        };
        ldap: {
            loginEnabled: FrontendSettings['sso']['ldap']['loginEnabled'];
            loginLabel: FrontendSettings['sso']['ldap']['loginLabel'];
        };
        oidc: {
            loginEnabled: FrontendSettings['sso']['oidc']['loginEnabled'];
            loginUrl: FrontendSettings['sso']['oidc']['loginUrl'];
        };
    };
    communityNodesEnabled: FrontendSettings['communityNodesEnabled'];
    mfa?: {
        enabled: boolean;
        enforced: boolean;
    };
};
export declare class FrontendService {
    private readonly globalConfig;
    private readonly logger;
    private readonly loadNodesAndCredentials;
    private readonly credentialTypes;
    private readonly credentialsOverwrites;
    private readonly license;
    private readonly mailer;
    private readonly instanceSettings;
    private readonly urlService;
    private readonly securityConfig;
    private readonly pushConfig;
    private readonly binaryDataConfig;
    private readonly licenseState;
    private readonly moduleRegistry;
    private readonly mfaService;
    private readonly ownershipService;
    private readonly aiUsageService;
    private readonly workflowRepository;
    private readonly workflowReviewPolicyService;
    private readonly inboxService;
    private settings;
    private publishedWorkflowCountCache?;
    private publishedWorkflowCountRequest?;
    private writeQueue;
    constructor(globalConfig: GlobalConfig, logger: Logger, loadNodesAndCredentials: LoadNodesAndCredentials, credentialTypes: CredentialTypes, credentialsOverwrites: CredentialsOverwrites, license: License, mailer: UserManagementMailer, instanceSettings: InstanceSettings, urlService: UrlService, securityConfig: SecurityConfig, pushConfig: PushConfig, binaryDataConfig: BinaryDataConfig, licenseState: LicenseState, moduleRegistry: ModuleRegistry, mfaService: MfaService, ownershipService: OwnershipService, aiUsageService: AiUsageService, workflowRepository: WorkflowRepository, workflowReviewPolicyService: WorkflowReviewPolicyService, inboxService: InboxService);
    private collectEnvFeatureFlags;
    private getShowSetupOnFirstLoad;
    private initSettings;
    generateTypes(): Promise<void>;
    private enqueueWrite;
    private writeTypesFiles;
    getSettings(): Promise<FrontendSettings>;
    private getPublishedWorkflowCountForDynamicBanners;
    getPublicSettings(includeMfaSettings: boolean): Promise<PublicFrontendSettings>;
    getModuleSettings(): {
        [k: string]: import("@n8n/decorators").ModuleSettings;
    };
    getNodeVersionIdentifiers(nodes: INodeTypeDescription[]): string[];
    private writeStaticJSON;
    private overwriteCredentialsProperties;
}
