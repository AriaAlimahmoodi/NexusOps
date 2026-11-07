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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentBudgetAlertService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const email_1 = require("../../user-management/email");
const agent_repository_1 = require("./repositories/agent.repository");
let AgentBudgetAlertService = class AgentBudgetAlertService {
    constructor(globalConfig, agentRepository, projectRepository, mailer, urlService, logger) {
        this.globalConfig = globalConfig;
        this.agentRepository = agentRepository;
        this.projectRepository = projectRepository;
        this.mailer = mailer;
        this.urlService = urlService;
        this.logger = logger;
    }
    notifyMonthlyThreshold(notice) {
        if (this.globalConfig.deployment.type !== 'cloud')
            return;
        void this.sendMonthlyThresholdEmail(notice).catch((error) => {
            this.logger.error('Failed to send the agent budget alert email', {
                agentId: notice.agentId,
                error: error instanceof Error ? error.message : String(error),
            });
        });
    }
    async sendMonthlyThresholdEmail(notice) {
        if (!this.mailer.isEmailSetUp) {
            this.logger.debug('Skipped the agent budget alert email because SMTP is not configured', {
                agentId: notice.agentId,
            });
            return;
        }
        const agent = await this.agentRepository.findBudgetAlertTarget(notice.agentId);
        if (!agent) {
            this.logger.debug('Skipped the agent budget alert email because the agent is gone', {
                agentId: notice.agentId,
            });
            return;
        }
        const owner = await this.projectRepository.findCreatorContact(agent.projectId);
        if (!owner) {
            this.logger.warn('Skipped the agent budget alert email because the project has no owner', {
                agentId: notice.agentId,
                projectId: agent.projectId,
            });
            return;
        }
        const baseUrl = this.urlService.getInstanceBaseUrl();
        const result = await this.mailer.agentBudgetAlert({
            email: owner.email,
            firstName: owner.firstName,
            agentName: agent.name,
            agentUrl: `${baseUrl}/projects/${agent.projectId}/agents/${notice.agentId}`,
            alertThresholdPercent: notice.alertThresholdPercent,
        });
        if (result.emailSent) {
            this.logger.info('Sent the agent budget alert email', {
                agentId: notice.agentId,
                projectId: agent.projectId,
            });
        }
    }
};
exports.AgentBudgetAlertService = AgentBudgetAlertService;
exports.AgentBudgetAlertService = AgentBudgetAlertService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, agent_repository_1.AgentRepository, db_1.ProjectRepository, email_1.UserManagementMailer, backend_services_1.UrlService, backend_common_1.Logger])
], AgentBudgetAlertService);
//# sourceMappingURL=agent-budget-alert.service.js.map