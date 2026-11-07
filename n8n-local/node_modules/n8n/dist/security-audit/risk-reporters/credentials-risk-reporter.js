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
exports.CredentialsRiskReporter = void 0;
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const constants_1 = require("../../security-audit/constants");
let CredentialsRiskReporter = class CredentialsRiskReporter {
    constructor(credentialsRepository, executionRepository, securityConfig) {
        this.credentialsRepository = credentialsRepository;
        this.executionRepository = executionRepository;
        this.securityConfig = securityConfig;
    }
    async report(workflows) {
        const days = this.securityConfig.daysAbandonedWorkflow;
        const allExistingCreds = await this.getAllExistingCreds();
        const { credsInAnyUse, credsInActiveUse } = this.getAllCredsInUse(workflows);
        const recentlyExecutedCreds = await this.getCredentialsInRecentlyExecutedWorkflows(workflows, days);
        const credsNotInAnyUse = allExistingCreds.filter((c) => !credsInAnyUse.has(c.id));
        const credsNotInActiveUse = allExistingCreds.filter((c) => !credsInActiveUse.has(c.id));
        const credsNotRecentlyExecuted = allExistingCreds.filter((c) => !recentlyExecutedCreds.has(c.id));
        const issues = [credsNotInAnyUse, credsNotInActiveUse, credsNotRecentlyExecuted];
        if (issues.every((i) => i.length === 0))
            return null;
        const report = {
            risk: constants_1.CREDENTIALS_REPORT.RISK,
            sections: [],
        };
        const hint = 'Keeping unused credentials in your instance is an unneeded security risk.';
        const recommendation = 'Consider deleting these credentials if you no longer need them.';
        const sentenceStart = ({ length }) => length > 1 ? 'These credentials are' : 'This credential is';
        if (credsNotInAnyUse.length > 0) {
            report.sections.push({
                title: constants_1.CREDENTIALS_REPORT.SECTIONS.CREDS_NOT_IN_ANY_USE,
                description: [sentenceStart(credsNotInAnyUse), 'not used in any workflow.', hint].join(' '),
                recommendation,
                location: credsNotInAnyUse,
            });
        }
        if (credsNotInActiveUse.length > 0) {
            report.sections.push({
                title: constants_1.CREDENTIALS_REPORT.SECTIONS.CREDS_NOT_IN_ACTIVE_USE,
                description: [
                    sentenceStart(credsNotInActiveUse),
                    'not used in active workflows.',
                    hint,
                ].join(' '),
                recommendation,
                location: credsNotInActiveUse,
            });
        }
        if (credsNotRecentlyExecuted.length > 0) {
            report.sections.push({
                title: constants_1.CREDENTIALS_REPORT.SECTIONS.CREDS_NOT_RECENTLY_EXECUTED,
                description: [
                    sentenceStart(credsNotRecentlyExecuted),
                    `not used in recently executed workflows, i.e. workflows executed in the past ${days} days.`,
                    hint,
                ].join(' '),
                recommendation,
                location: credsNotRecentlyExecuted,
            });
        }
        return report;
    }
    getAllCredsInUse(workflows) {
        const credsInAnyUse = new Set();
        const credsInActiveUse = new Set();
        workflows.forEach((workflow) => {
            workflow.nodes.forEach((node) => {
                if (!node.credentials)
                    return;
                Object.values(node.credentials).forEach((cred) => {
                    if (!cred?.id)
                        return;
                    credsInAnyUse.add(cred.id);
                    if (workflow.activeVersionId !== null) {
                        credsInActiveUse.add(cred.id);
                    }
                });
            });
        });
        return {
            credsInAnyUse,
            credsInActiveUse,
        };
    }
    async getAllExistingCreds() {
        const credentials = await this.credentialsRepository.find({
            select: ['id', 'name'],
            where: { usageScope: 'project' },
        });
        return credentials.map(({ id, name }) => ({ kind: 'credential', id, name }));
    }
    async getCredentialsInRecentlyExecutedWorkflows(workflows, days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        const recentlyExecutedWorkflowIds = new Set(await this.executionRepository.getWorkflowIdsWithExecutionsSince(date));
        const credentialIds = workflows
            .filter((workflow) => recentlyExecutedWorkflowIds.has(workflow.id))
            .flatMap((workflow) => workflow.nodes)
            .flatMap((node) => Object.values(node.credentials ?? {}))
            .map((credential) => credential.id)
            .filter((id) => id !== undefined);
        return new Set(credentialIds);
    }
};
exports.CredentialsRiskReporter = CredentialsRiskReporter;
exports.CredentialsRiskReporter = CredentialsRiskReporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.CredentialsRepository, db_1.ExecutionRepository, config_1.SecurityConfig])
], CredentialsRiskReporter);
//# sourceMappingURL=credentials-risk-reporter.js.map