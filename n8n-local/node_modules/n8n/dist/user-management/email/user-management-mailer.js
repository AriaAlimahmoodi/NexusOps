"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManagementMailer = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const handlebars_1 = __importDefault(require("handlebars"));
const path_1 = require("path");
const node_mailer_1 = require("./node-mailer");
const errors_1 = require("@n8n/errors");
const utils_1 = require("../../utils");
const REVOKED_AT_FORMATTER = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});
function formatRevokedAt(date) {
    return REVOKED_AT_FORMATTER.format(date);
}
function formatRevokedBy(user) {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.email;
}
let UserManagementMailer = class UserManagementMailer {
    constructor(globalConfig, logger, userRepository, urlService, eventService) {
        this.logger = logger;
        this.userRepository = userRepository;
        this.urlService = urlService;
        this.eventService = eventService;
        this.templatesCache = {};
        const emailsConfig = globalConfig.userManagement.emails;
        this.isEmailSetUp = emailsConfig.mode === 'smtp' && emailsConfig.smtp.host !== '';
        this.templateOverrides = emailsConfig.template;
        if (this.isEmailSetUp) {
            this.mailer = di_1.Container.get(node_mailer_1.NodeMailer);
        }
    }
    async invite(inviteEmailData) {
        if (!this.mailer)
            return { emailSent: false };
        const template = await this.getTemplate('user-invited');
        return await this.mailer.sendMail({
            emailRecipients: inviteEmailData.email,
            subject: 'You have been invited to n8n',
            body: template({ ...this.basePayload, ...inviteEmailData }),
        });
    }
    async passwordReset(passwordResetData) {
        if (!this.mailer)
            return { emailSent: false };
        const template = await this.getTemplate('password-reset-requested');
        return await this.mailer.sendMail({
            emailRecipients: passwordResetData.email,
            subject: 'n8n password reset',
            body: template({ ...this.basePayload, ...passwordResetData }),
        });
    }
    async emailChangeConfirmation(data) {
        if (!this.mailer)
            return { emailSent: false };
        const template = await this.getTemplate('email-change-requested');
        return await this.mailer.sendMail({
            emailRecipients: data.email,
            subject: 'Confirm your n8n email change',
            body: template({ ...this.basePayload, ...data }),
        });
    }
    async emailChangeCompleted(data) {
        if (!this.mailer)
            return { emailSent: false };
        const template = await this.getTemplate('email-change-completed');
        return await this.mailer.sendMail({
            emailRecipients: data.email,
            subject: 'Your n8n email was changed',
            body: template({ ...this.basePayload, ...data }),
        });
    }
    async notifyApiKeyRevoked({ apiKey, revoker, }) {
        if (!this.mailer)
            return { emailSent: false };
        const baseUrl = this.urlService.getInstanceBaseUrl();
        const template = await this.getTemplate('api-key-revoked');
        return await this.mailer.sendMail({
            emailRecipients: apiKey.user.email,
            subject: 'Your n8n API key was revoked',
            body: template({
                ...this.basePayload,
                email: apiKey.user.email,
                firstName: apiKey.user.firstName ?? 'there',
                label: apiKey.label,
                suffix: apiKey.apiKey.slice(-4),
                revokedBy: formatRevokedBy(revoker),
                revokedAt: formatRevokedAt(new Date()),
                createApiKeyUrl: `${baseUrl}/settings/api`,
            }),
        });
    }
    async notifyMcpClientRevoked({ clientName, owner, revoker, }) {
        if (!this.mailer)
            return { emailSent: false };
        const baseUrl = this.urlService.getInstanceBaseUrl();
        const template = await this.getTemplate('mcp-client-revoked');
        return await this.mailer.sendMail({
            emailRecipients: owner.email,
            subject: 'Your n8n MCP client access was revoked',
            body: template({
                ...this.basePayload,
                email: owner.email,
                firstName: owner.firstName ?? 'there',
                clientName,
                revokedBy: formatRevokedBy(revoker),
                revokedAt: formatRevokedAt(new Date()),
                mcpSettingsUrl: `${baseUrl}/settings/mcp`,
            }),
        });
    }
    async agentBudgetAlert(data) {
        if (!this.mailer)
            return { emailSent: false };
        const template = await this.getTemplate('agent-budget-alert');
        return await this.mailer.sendMail({
            emailRecipients: data.email,
            subject: 'Your agent reached its monthly budget alert',
            body: template({
                ...this.basePayload,
                firstName: data.firstName || 'there',
                agentName: data.agentName,
                agentUrl: data.agentUrl,
                percent: data.alertThresholdPercent,
            }),
        });
    }
    async migrationFindings(data) {
        if (!this.mailer)
            return { emailSent: false };
        const baseUrl = this.urlService.getInstanceBaseUrl();
        const template = await this.getTemplate('migration-findings');
        return await this.mailer.sendMail({
            emailRecipients: data.email,
            subject: `Your workflows need changes before the upgrade to n8n ${data.targetVersion}`,
            body: template({
                ...this.basePayload,
                firstName: data.firstName || 'there',
                notifierName: data.notifierName,
                ruleTitle: data.ruleTitle,
                targetVersion: data.targetVersion,
                workflows: data.workflows.map((workflow) => ({
                    name: workflow.name,
                    url: `${baseUrl}/workflow/${workflow.id}`,
                })),
                reportUrl: data.reportUrl,
            }),
        });
    }
    async workflowFailure(data) {
        if (!this.mailer)
            return { emailSent: false };
        const baseUrl = this.urlService.getInstanceBaseUrl();
        const workflowUrl = `${baseUrl}/workflow/${data.workflowId}`;
        const template = await this.getTemplate('workflow-failure');
        return await this.mailer.sendMail({
            emailRecipients: data.email,
            subject: '⚠️ Your workflow failed. Get alerts next time',
            body: template({
                ...this.basePayload,
                firstName: data.firstName ?? 'there',
                workflowId: data.workflowId,
                workflowName: data.workflowName,
                workflowUrl,
                instanceURL: baseUrl,
            }),
        });
    }
    async sendNotificationEmails({ mailerTemplate, recipients, sharer, getTemplateData, subjectBuilder, messageType, }) {
        if (!this.mailer)
            return { emailSent: false };
        if (recipients.length === 0)
            return { emailSent: false };
        const populateTemplate = await this.getTemplate(mailerTemplate);
        try {
            const promises = recipients.map(async (recipient) => {
                const templateData = getTemplateData(recipient);
                return await this.mailer.sendMail({
                    emailRecipients: recipient.email,
                    subject: subjectBuilder(),
                    body: populateTemplate({ ...this.basePayload, ...templateData }),
                });
            });
            const results = await Promise.allSettled(promises);
            const errors = results.filter((result) => result.status === 'rejected');
            this.logger.info(`Sent ${messageType} email ${errors.length ? 'with errors' : 'successfully'}`, {
                sharerId: sharer.id,
            });
            this.eventService.emit('user-transactional-email-sent', {
                userId: sharer.id,
                messageType,
                publicApi: false,
            });
            return {
                emailSent: true,
                errors: errors.map((e) => e.reason),
            };
        }
        catch (e) {
            this.eventService.emit('email-failed', {
                user: sharer,
                messageType,
                publicApi: false,
            });
            const error = (0, utils_1.toError)(e);
            throw new errors_1.InternalServerError(`Please contact your administrator: ${error.message}`, e);
        }
    }
    async notifyWorkflowAutodeactivated({ recipient, workflow, }) {
        const recipients = await this.userRepository.getEmailsByIds([recipient.id]);
        const baseUrl = this.urlService.getInstanceBaseUrl();
        return await this.sendNotificationEmails({
            mailerTemplate: 'workflow-deactivated',
            recipients,
            sharer: recipient,
            getTemplateData: () => ({
                workflowName: workflow.name,
                workflowUrl: `${baseUrl}/workflow/${workflow.id}`,
            }),
            subjectBuilder: () => 'n8n has automatically autodeactivated a workflow',
            messageType: 'Workflow auto-deactivated',
        });
    }
    async notifyWorkflowShared({ sharer, newShareeIds, workflow, }) {
        const recipients = await this.userRepository.getEmailsByIds(newShareeIds);
        const baseUrl = this.urlService.getInstanceBaseUrl();
        return await this.sendNotificationEmails({
            mailerTemplate: 'workflow-shared',
            recipients,
            sharer,
            getTemplateData: () => ({
                workflowName: workflow.name,
                workflowUrl: `${baseUrl}/workflow/${workflow.id}`,
            }),
            subjectBuilder: () => `${sharer.firstName} has shared an n8n workflow with you`,
            messageType: 'Workflow shared',
        });
    }
    async notifyCredentialsShared({ sharer, newShareeIds, credentialsName, }) {
        const recipients = await this.userRepository.getEmailsByIds(newShareeIds);
        const baseUrl = this.urlService.getInstanceBaseUrl();
        return await this.sendNotificationEmails({
            mailerTemplate: 'credentials-shared',
            recipients,
            sharer,
            getTemplateData: () => ({
                credentialsName,
                credentialsListUrl: `${baseUrl}/home/credentials`,
            }),
            subjectBuilder: () => `${sharer.firstName} has shared an n8n credential with you`,
            messageType: 'Credentials shared',
        });
    }
    async notifyProjectShared({ sharer, newSharees, project, }) {
        const recipients = await this.userRepository.getEmailsByIds(newSharees.map((s) => s.userId));
        const baseUrl = this.urlService.getInstanceBaseUrl();
        const recipientsData = newSharees
            .map((sharee) => {
            const recipient = recipients.find((r) => r.id === sharee.userId);
            if (!recipient)
                return null;
            return {
                email: recipient.email,
                role: sharee.role.split('project:')?.[1] ?? sharee.role,
            };
        })
            .filter(Boolean);
        return await this.sendNotificationEmails({
            mailerTemplate: 'project-shared',
            recipients: recipientsData,
            sharer,
            getTemplateData: (recipient) => ({
                role: recipient.role,
                projectName: project.name,
                projectUrl: `${baseUrl}/projects/${project.id}`,
            }),
            subjectBuilder: () => `${sharer.firstName} has invited you to a project`,
            messageType: 'Project shared',
        });
    }
    async getTemplate(templateName) {
        let template = this.templatesCache[templateName];
        if (!template) {
            const fileExtension = backend_common_1.inTest ? 'mjml' : 'handlebars';
            const templateOverride = this.templateOverrides[templateName];
            const templatePath = templateOverride && (0, fs_1.existsSync)(templateOverride)
                ? templateOverride
                : (0, path_1.join)(__dirname, `templates/${templateName}.${fileExtension}`);
            const markup = await (0, promises_1.readFile)(templatePath, 'utf-8');
            template = handlebars_1.default.compile(markup);
            this.templatesCache[templateName] = template;
        }
        return template;
    }
    get basePayload() {
        const baseUrl = this.urlService.getInstanceBaseUrl();
        const domain = new URL(baseUrl).hostname;
        const currentYear = new Date().getFullYear();
        return { baseUrl, domain, currentYear };
    }
};
exports.UserManagementMailer = UserManagementMailer;
exports.UserManagementMailer = UserManagementMailer = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, backend_common_1.Logger, db_1.UserRepository, backend_services_1.UrlService, backend_services_1.EventService])
], UserManagementMailer);
//# sourceMappingURL=user-management-mailer.js.map