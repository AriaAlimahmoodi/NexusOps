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
exports.RoleResolverService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const claims_context_builder_1 = require("./claims-context.builder");
let RoleResolverService = class RoleResolverService {
    constructor(logger, projectRepository) {
        this.logger = logger;
        this.projectRepository = projectRepository;
    }
    async resolveRoles(config, context, ctx = {}) {
        const projects = await this.collectProjectInfoForRules(config.projectRoleRules, ctx);
        const instanceRole = this.resolveInstanceRole(config.instanceRoleRules, context, config.fallbackInstanceRole);
        const projectRoles = this.resolveProjectRoles(config.projectRoleRules, context, projects);
        return { instanceRole, projectRoles };
    }
    async collectProjectInfoForRules(rules, ctx) {
        const projectIds = [
            ...new Set(rules.filter((r) => r.enabled && r.projectId).map((r) => r.projectId)),
        ];
        if (projectIds.length === 0) {
            return new Map();
        }
        const projects = await this.projectRepository.findTeamProjectInfoByIds(projectIds, ctx);
        const map = new Map();
        for (const project of projects) {
            map.set(project.id, {
                id: project.id,
                name: project.name,
                type: project.type,
                description: project.description,
            });
        }
        return map;
    }
    resolveInstanceRole(rules, context, fallback) {
        for (const rule of rules) {
            if (!rule.enabled)
                continue;
            if (this.evaluateExpression(rule.expression, context, rule.id)) {
                return {
                    role: rule.role,
                    matchedRuleId: rule.id,
                    expression: rule.expression,
                    isFallback: false,
                };
            }
        }
        return { role: fallback, matchedRuleId: null, expression: null, isFallback: true };
    }
    resolveProjectRoles(rules, context, projects) {
        const matched = new Map();
        for (const rule of rules) {
            if (!rule.enabled)
                continue;
            if (!rule.projectId)
                continue;
            if (matched.has(rule.projectId))
                continue;
            const project = projects.get(rule.projectId);
            if (!project) {
                this.logger.warn(`Skipping role mapping rule "${rule.id}": project "${rule.projectId}" not found or not a team project`);
                continue;
            }
            const enrichedContext = (0, claims_context_builder_1.withProjectContext)(context, project);
            if (this.evaluateExpression(rule.expression, enrichedContext, rule.id)) {
                matched.set(rule.projectId, {
                    projectId: rule.projectId,
                    role: rule.role,
                    matchedRuleId: rule.id,
                    expression: rule.expression,
                });
            }
        }
        return matched;
    }
    evaluateExpression(expression, context, ruleId) {
        try {
            const result = n8n_workflow_1.Expression.resolveWithoutWorkflow(expression, context);
            const matched = String(result) === 'true';
            this.logger.debug('Role mapping rule evaluated', {
                ruleId,
                matched,
                resultType: typeof result,
            });
            return matched;
        }
        catch (error) {
            this.logger.warn('Role resolver expression evaluation failed, treating as false', {
                ruleId,
                expression,
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
};
exports.RoleResolverService = RoleResolverService;
exports.RoleResolverService = RoleResolverService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.ProjectRepository])
], RoleResolverService);
//# sourceMappingURL=role-resolver.service.ee.js.map