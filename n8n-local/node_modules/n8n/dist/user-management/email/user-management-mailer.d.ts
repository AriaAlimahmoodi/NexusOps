import { Logger } from '@n8n/backend-common';
import { EventService, UrlService } from '@n8n/backend-services';
import { GlobalConfig } from '@n8n/config';
import type { ApiKey, User } from '@n8n/db';
import { UserRepository } from '@n8n/db';
import { AssignableProjectRole } from '@n8n/permissions';
import type { IWorkflowBase } from 'n8n-workflow';
import type { EmailChangeCompletedData, EmailChangeConfirmationData, InviteEmailData, PasswordResetData, SendEmailResult } from './interfaces';
import { NodeMailer } from './node-mailer';
type Template = HandlebarsTemplateDelegate<unknown>;
type TemplateName = 'user-invited' | 'password-reset-requested' | 'workflow-deactivated' | 'workflow-shared' | 'credentials-shared' | 'project-shared' | 'workflow-failure' | 'api-key-revoked' | 'mcp-client-revoked' | 'email-change-requested' | 'email-change-completed' | 'agent-budget-alert' | 'migration-findings';
export declare class UserManagementMailer {
    private readonly logger;
    private readonly userRepository;
    private readonly urlService;
    private readonly eventService;
    readonly isEmailSetUp: boolean;
    readonly templateOverrides: GlobalConfig['userManagement']['emails']['template'];
    readonly templatesCache: Partial<Record<TemplateName, Template>>;
    readonly mailer: NodeMailer | undefined;
    constructor(globalConfig: GlobalConfig, logger: Logger, userRepository: UserRepository, urlService: UrlService, eventService: EventService);
    invite(inviteEmailData: InviteEmailData): Promise<SendEmailResult>;
    passwordReset(passwordResetData: PasswordResetData): Promise<SendEmailResult>;
    emailChangeConfirmation(data: EmailChangeConfirmationData): Promise<SendEmailResult>;
    emailChangeCompleted(data: EmailChangeCompletedData): Promise<SendEmailResult>;
    notifyApiKeyRevoked({ apiKey, revoker, }: {
        apiKey: ApiKey;
        revoker: User;
    }): Promise<SendEmailResult>;
    notifyMcpClientRevoked({ clientName, owner, revoker, }: {
        clientName: string;
        owner: {
            email: string;
            firstName?: string | null;
        };
        revoker: User;
    }): Promise<SendEmailResult>;
    agentBudgetAlert(data: {
        email: string;
        firstName?: string | null;
        agentName: string;
        agentUrl: string;
        alertThresholdPercent: number;
    }): Promise<SendEmailResult>;
    migrationFindings(data: {
        email: string;
        firstName?: string | null;
        notifierName: string;
        ruleTitle: string;
        targetVersion: string;
        workflows: Array<{
            id: string;
            name: string;
        }>;
        reportUrl: string;
    }): Promise<SendEmailResult>;
    workflowFailure(data: {
        email: string;
        firstName?: string;
        workflowId: string;
        workflowName: string;
    }): Promise<SendEmailResult>;
    private sendNotificationEmails;
    notifyWorkflowAutodeactivated({ recipient, workflow, }: {
        recipient: User;
        workflow: IWorkflowBase;
    }): Promise<SendEmailResult>;
    notifyWorkflowShared({ sharer, newShareeIds, workflow, }: {
        sharer: User;
        newShareeIds: string[];
        workflow: IWorkflowBase;
    }): Promise<SendEmailResult>;
    notifyCredentialsShared({ sharer, newShareeIds, credentialsName, }: {
        sharer: User;
        newShareeIds: string[];
        credentialsName: string;
    }): Promise<SendEmailResult>;
    notifyProjectShared({ sharer, newSharees, project, }: {
        sharer: User;
        newSharees: Array<{
            userId: string;
            role: AssignableProjectRole;
        }>;
        project: {
            id: string;
            name: string;
        };
    }): Promise<SendEmailResult>;
    getTemplate(templateName: TemplateName): Promise<Template>;
    private get basePayload();
}
export {};
