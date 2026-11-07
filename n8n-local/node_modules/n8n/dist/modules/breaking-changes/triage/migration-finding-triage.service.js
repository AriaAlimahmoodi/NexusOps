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
exports.MigrationFindingTriageService = void 0;
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const breaking_changes_rule_registry_service_1 = require("../breaking-changes.rule-registry.service");
const migration_finding_repository_1 = require("../database/repositories/migration-finding.repository");
const types_1 = require("../types");
let MigrationFindingTriageService = class MigrationFindingTriageService {
    constructor(ruleRegistry, findingRepository) {
        this.ruleRegistry = ruleRegistry;
        this.findingRepository = findingRepository;
    }
    async setStatus(ruleId, workflowId, status) {
        const version = this.getWorkflowRuleVersion(ruleId);
        const updated = await this.findingRepository.setTriageStatus(version, ruleId, workflowId, status, {});
        if (!updated) {
            throw new errors_1.NotFoundError(`Finding of rule '${ruleId}' for workflow '${workflowId}' not found.`);
        }
    }
    async setStatuses(ruleId, workflowIds, status) {
        const version = this.getWorkflowRuleVersion(ruleId);
        await this.findingRepository.setTriageStatusForWorkflows(version, ruleId, workflowIds, status, {});
    }
    getWorkflowRuleVersion(ruleId) {
        const rule = this.ruleRegistry.getRule(ruleId);
        if (!rule || !(0, types_1.isWorkflowLevelRule)(rule)) {
            throw new errors_1.NotFoundError(`Breaking change rule with ID '${ruleId}' not found.`);
        }
        return rule.getMetadata().version;
    }
};
exports.MigrationFindingTriageService = MigrationFindingTriageService;
exports.MigrationFindingTriageService = MigrationFindingTriageService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [breaking_changes_rule_registry_service_1.RuleRegistry, migration_finding_repository_1.MigrationFindingRepository])
], MigrationFindingTriageService);
//# sourceMappingURL=migration-finding-triage.service.js.map