import type { AgentActor, CreateSlackManagerCredentialResponse, InstallSlackManagedAppResponse, SlackManagedAppSettings, SlackManagedSetupState } from '@n8n/api-types';
import type { User } from '@n8n/db';
import { Cipher } from 'n8n-core';
import { CredentialsFinderService, CacheService } from '@n8n/backend-services';
import { CredentialsService } from '../../../../../credentials/credentials.service';
import { CredentialsOverwrites } from '../../../../../credentials-overwrites';
import { SlackMethodsService } from './slack-methods.service';
import type { ProjectAgent } from '../../../entities/agent.entity';
import { AgentRepository } from '../../../repositories/agent.repository';
import type { AgentIntegrationRemovalContext } from '../../agent-chat-integration';
export interface GetManagedSetupStateOptions {
    projectId: string;
    agentId: string;
    user: User;
}
export interface InstallManagedSlackAppOptions extends GetManagedSetupStateOptions {
    managerCredentialId: string;
    workspaceId: string;
    modifiedBy?: AgentActor;
}
export interface FinalizeSlackManagerCredentialOptions extends GetManagedSetupStateOptions {
    credentialId: string;
}
export interface GetManagedSlackAppSettingsOptions extends GetManagedSetupStateOptions {
    credentialId: string;
}
export interface UpdateManagedSlackAppSettingsOptions extends GetManagedSlackAppSettingsOptions {
    name: string;
    description: string;
    alwaysOnline: boolean;
}
export interface ManagedSlackAppDeletionWarning {
    integrationType: 'slack';
    code: 'app_not_deleted';
    action: {
        type: 'open_url';
        url: string;
    };
    details: {
        appId: string;
    };
}
export declare class SlackManagedSetupService {
    private readonly methods;
    private readonly cacheService;
    private readonly cipher;
    private readonly credentialsService;
    private readonly credentialsFinderService;
    private readonly credentialsOverwrites;
    private readonly agentRepository;
    constructor(methods: SlackMethodsService, cacheService: CacheService, cipher: Cipher, credentialsService: CredentialsService, credentialsFinderService: CredentialsFinderService, credentialsOverwrites: CredentialsOverwrites, agentRepository: AgentRepository);
    isSetupAvailable(): boolean;
    getSetupState(options: GetManagedSetupStateOptions): Promise<SlackManagedSetupState>;
    createManagerCredential(options: GetManagedSetupStateOptions): Promise<CreateSlackManagerCredentialResponse>;
    finalizeManagerCredential(options: FinalizeSlackManagerCredentialOptions): Promise<void>;
    installApp(options: InstallManagedSlackAppOptions): Promise<InstallSlackManagedAppResponse>;
    getAppSettings(options: GetManagedSlackAppSettingsOptions): Promise<SlackManagedAppSettings>;
    updateAppSettings(options: UpdateManagedSlackAppSettingsOptions): Promise<SlackManagedAppSettings>;
    isAppConfiguredForAgent(credentialId: string, agent: ProjectAgent, user: User): Promise<boolean>;
    private managedAppSendsEventsTo;
    deleteAppForCredential(options: AgentIntegrationRemovalContext): Promise<ManagedSlackAppDeletionWarning | undefined>;
    private assertSetupAvailable;
    private getManagedBotCredentialContext;
    private exportManagedAppManifest;
    private managedAppSettingsFromManifest;
    private getManagerCredentialContext;
    private usesManagedSlackAuth;
    private getWorkspacesFromContext;
    private findManagedBotCredential;
    private getOrCreateManagedAppSession;
    private callManagerSlackApi;
    private setManagedAppIcon;
    private getManagerCredentialSummary;
    private listWorkspaceRecords;
    private getInstallWorkspace;
    private connectManagedInstallation;
    private prepareManualInstall;
    private deleteManagedExternalApp;
    private createManagedAppSession;
    private refreshManagerAccessToken;
    private saveRefreshedManagerToken;
}
