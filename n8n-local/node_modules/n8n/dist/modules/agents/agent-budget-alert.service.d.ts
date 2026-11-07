import { Logger } from '@n8n/backend-common';
import { UrlService } from '@n8n/backend-services';
import { GlobalConfig } from '@n8n/config';
import { ProjectRepository } from '@n8n/db';
import { UserManagementMailer } from '../../user-management/email';
import { AgentRepository } from './repositories/agent.repository';
export interface MonthlyBudgetAlertNotice {
    agentId: string;
    alertThresholdPercent: number;
}
export declare class AgentBudgetAlertService {
    private readonly globalConfig;
    private readonly agentRepository;
    private readonly projectRepository;
    private readonly mailer;
    private readonly urlService;
    private readonly logger;
    constructor(globalConfig: GlobalConfig, agentRepository: AgentRepository, projectRepository: ProjectRepository, mailer: UserManagementMailer, urlService: UrlService, logger: Logger);
    notifyMonthlyThreshold(notice: MonthlyBudgetAlertNotice): void;
    private sendMonthlyThresholdEmail;
}
