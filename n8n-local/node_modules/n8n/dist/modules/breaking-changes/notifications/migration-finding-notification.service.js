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
exports.MigrationFindingNotificationService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const user_management_mailer_1 = require("../../../user-management/email/user-management-mailer");
const breaking_changes_rule_registry_service_1 = require("../breaking-changes.rule-registry.service");
const migration_finding_repository_1 = require("../database/repositories/migration-finding.repository");
const migration_workflow_owner_repository_1 = require("../database/repositories/migration-workflow-owner.repository");
const types_1 = require("../types");
function displayName(user) {
    return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'An admin';
}
let MigrationFindingNotificationService = class MigrationFindingNotificationService {
    constructor(ruleRegistry, findingRepository, ownerRepository, userRepository, mailer, urlService, logger) {
        this.ruleRegistry = ruleRegistry;
        this.findingRepository = findingRepository;
        this.ownerRepository = ownerRepository;
        this.userRepository = userRepository;
        this.mailer = mailer;
        this.urlService = urlService;
        this.logger = logger;
        this.logger = logger.scoped('breaking-changes');
    }
    async notifyOwners(ruleId, workflowIds, notifier) {
        const rule = this.ruleRegistry.getRule(ruleId);
        if (!rule || !(0, types_1.isWorkflowLevelRule)(rule)) {
            throw new errors_1.NotFoundError(`Breaking change rule with ID '${ruleId}' not found.`);
        }
        if (!this.mailer.isEmailSetUp) {
            throw new errors_1.BadRequestError('Email is not set up on this instance, so owners cannot be notified');
        }
        const { version, title } = rule.getMetadata();
        const result = { notifiedWorkflowIds: [], skipped: [] };
        const skip = (ids, reason) => {
            for (const workflowId of ids)
                result.skipped.push({ workflowId, reason });
        };
        const findings = (await this.findingRepository.listTriageableForRule(version, ruleId, workflowIds, {})).filter((finding) => finding.status !== 'wont_fix');
        const findingByWorkflow = new Map(findings.map((finding) => [finding.workflowId, finding]));
        skip(workflowIds.filter((workflowId) => !findingByWorkflow.has(workflowId)), 'no_finding');
        const findingsByOwner = await this.groupByOwner(findings);
        skip(findings
            .filter((finding) => !findingsByOwner.has(finding.workflowId))
            .map((finding) => finding.workflowId), 'no_owner');
        const reportUrl = `${this.urlService.getInstanceBaseUrl()}/settings/migration-report/${ruleId}`;
        const notifierName = displayName(notifier);
        await Promise.all([...new Set(findingsByOwner.values())].map(async ({ owner, findings: ownerFindings }) => {
            const ownerWorkflowIds = ownerFindings.map((finding) => finding.workflowId);
            let emailSent = false;
            try {
                ({ emailSent } = await this.mailer.migrationFindings({
                    email: owner.email,
                    firstName: owner.firstName,
                    notifierName,
                    ruleTitle: title,
                    targetVersion: version,
                    workflows: ownerFindings.map((finding) => ({
                        id: finding.workflowId,
                        name: finding.workflow.name,
                    })),
                    reportUrl,
                }));
            }
            catch (error) {
                this.logger.warn('Emailing a workflow owner about migration findings failed', {
                    ruleId,
                    ownerId: owner.id,
                    error,
                });
            }
            if (!emailSent) {
                skip(ownerWorkflowIds, 'send_failed');
                return;
            }
            try {
                await this.findingRepository.markNotifiedForIds(ownerFindings.map((finding) => finding.id), {});
            }
            catch (error) {
                this.logger.error('The owner was emailed, but the findings could not be marked notified', {
                    ruleId,
                    ownerId: owner.id,
                    error,
                });
            }
            result.notifiedWorkflowIds.push(...ownerWorkflowIds);
        }));
        return result;
    }
    async groupByOwner(findings) {
        const ownerRows = await this.ownerRepository.findByWorkflowIds(findings.map((finding) => finding.workflowId), {});
        const userIds = [...new Set(ownerRows.flatMap((row) => (row.userId ? [row.userId] : [])))];
        const users = userIds.length > 0 ? await this.userRepository.findManyByIds(userIds) : [];
        const usersById = new Map(users.map((user) => [user.id, user]));
        const ownerIdByWorkflow = new Map(ownerRows.map((row) => [row.workflowId, row.userId]));
        const groupsByOwner = new Map();
        const groupsByWorkflow = new Map();
        for (const finding of findings) {
            const userId = ownerIdByWorkflow.get(finding.workflowId);
            const user = userId ? usersById.get(userId) : undefined;
            if (!user?.email)
                continue;
            const group = groupsByOwner.get(user.id) ?? {
                owner: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                },
                findings: [],
            };
            group.findings.push(finding);
            groupsByOwner.set(user.id, group);
            groupsByWorkflow.set(finding.workflowId, group);
        }
        return groupsByWorkflow;
    }
};
exports.MigrationFindingNotificationService = MigrationFindingNotificationService;
exports.MigrationFindingNotificationService = MigrationFindingNotificationService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [breaking_changes_rule_registry_service_1.RuleRegistry, migration_finding_repository_1.MigrationFindingRepository, migration_workflow_owner_repository_1.MigrationWorkflowOwnerRepository, db_1.UserRepository, user_management_mailer_1.UserManagementMailer, backend_services_1.UrlService, backend_common_1.Logger])
], MigrationFindingNotificationService);
//# sourceMappingURL=migration-finding-notification.service.js.map