import type { FrontendSettings } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { ClientOAuth2Options } from '@n8n/client-oauth2';
import { GlobalConfig } from '@n8n/config';
import type { TagEntity, User, ICredentialsDb, PublicUser } from '@n8n/db';
import { CredentialsRepository, WorkflowRepository, SettingsRepository, UserRepository } from '@n8n/db';
import { ErrorReporter } from 'n8n-core';
import type { IRun, IWorkflowBase, Workflow, WorkflowExecuteMode, WorkflowExecutionSource } from 'n8n-workflow';
import type clientOAuth1 from 'oauth-1.0a';
import type { AbstractServer } from './abstract-server';
import type { Config } from './config';
import type { WorkflowHookContextService } from './workflow-hook-context.service';
export type WorkflowLifecycleHookActor = {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    role?: string;
};
export declare function toWorkflowLifecycleHookActor(user?: User): WorkflowLifecycleHookActor | undefined;
type ExternalHooksMap = {
    'n8n.ready': [server: AbstractServer, config: Config];
    'n8n.stop': never;
    'worker.ready': never;
    'activeWorkflows.initialized': never;
    'agent.preExecute': [agentId: string];
    'credentials.create': [encryptedData: ICredentialsDb];
    'credentials.update': [newCredentialData: ICredentialsDb];
    'credentials.delete': [credentialId: string];
    'frontend.settings': [frontendSettings: FrontendSettings];
    'mfa.beforeSetup': [user: User];
    'oauth1.authenticate': [
        oAuthOptions: clientOAuth1.Options,
        oauthRequestData: {
            oauth_callback: string;
        }
    ];
    'oauth2.authenticate': [oAuthOptions: ClientOAuth2Options];
    'oauth2.callback': [oAuthOptions: ClientOAuth2Options];
    'oauth2.dynamicClientRegistration': [registerPayload: {
        redirect_uris: string[];
    }];
    'tag.beforeCreate': [tag: TagEntity];
    'tag.afterCreate': [tag: TagEntity];
    'tag.beforeUpdate': [tag: TagEntity];
    'tag.afterUpdate': [tag: TagEntity];
    'tag.beforeDelete': [tagId: string];
    'tag.afterDelete': [tagId: string];
    'user.deleted': [user: PublicUser];
    'user.profile.beforeUpdate': [
        userId: string,
        currentEmail: string,
        payload: {
            email?: string;
            firstName?: string;
            lastName?: string;
        }
    ];
    'user.profile.update': [currentEmail: string, publicUser: PublicUser];
    'user.password.update': [updatedEmail: string, updatedPassword: string | null];
    'user.invited': [emails: string[]];
    'workflow.create': [
        createdWorkflow: IWorkflowBase,
        workflowContext: WorkflowHookContextService,
        actor?: WorkflowLifecycleHookActor
    ];
    'workflow.afterCreate': [
        createdWorkflow: IWorkflowBase,
        workflowContext: WorkflowHookContextService,
        actor?: WorkflowLifecycleHookActor
    ];
    'workflow.activate': [
        updatedWorkflow: IWorkflowBase,
        workflowContext: WorkflowHookContextService,
        actor?: WorkflowLifecycleHookActor
    ];
    'workflow.deactivate': [
        deactivatedWorkflow: IWorkflowBase,
        workflowContext: WorkflowHookContextService,
        actor?: WorkflowLifecycleHookActor
    ];
    'workflow.update': [
        updatedWorkflow: IWorkflowBase,
        workflowContext: WorkflowHookContextService,
        actor?: WorkflowLifecycleHookActor
    ];
    'workflow.afterUpdate': [
        updatedWorkflow: IWorkflowBase,
        workflowContext: WorkflowHookContextService,
        actor?: WorkflowLifecycleHookActor
    ];
    'workflow.delete': [workflowId: string, actor?: WorkflowLifecycleHookActor];
    'workflow.afterDelete': [workflowId: string, actor?: WorkflowLifecycleHookActor];
    'workflow.afterArchive': [workflowId: string, actor?: WorkflowLifecycleHookActor];
    'workflow.afterUnarchive': [workflowId: string, actor?: WorkflowLifecycleHookActor];
    'workflow.preExecute': [
        workflow: Workflow,
        mode: WorkflowExecuteMode,
        workflowContext: WorkflowHookContextService,
        source?: WorkflowExecutionSource
    ];
    'workflow.postExecute': [
        fullRunData: IRun | undefined,
        workflowData: IWorkflowBase,
        executionId: string,
        workflowContext: WorkflowHookContextService
    ];
};
type HookNames = keyof ExternalHooksMap;
export declare class ExternalHooks {
    private readonly logger;
    private readonly errorReporter;
    private readonly globalConfig;
    private readonly registered;
    private readonly dbCollections;
    constructor(logger: Logger, errorReporter: ErrorReporter, globalConfig: GlobalConfig, userRepository: UserRepository, settingsRepository: SettingsRepository, credentialsRepository: CredentialsRepository, workflowRepository: WorkflowRepository);
    init(): Promise<void>;
    private loadHooks;
    hasHook<HookName extends HookNames>(hookName: HookName): boolean;
    run<HookName extends HookNames>(hookName: HookName, hookParameters?: ExternalHooksMap[HookName]): Promise<void>;
}
export {};
