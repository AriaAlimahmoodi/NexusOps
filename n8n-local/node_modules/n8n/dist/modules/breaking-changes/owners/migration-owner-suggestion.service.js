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
exports.MigrationOwnerSuggestionService = exports.RECENT_ACTIONS_PER_WORKFLOW = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const workflow_owner_1 = require("./workflow-owner");
const MCP_AUTHOR_SUFFIX = ' (via MCP)';
exports.RECENT_ACTIONS_PER_WORKFLOW = 10;
let MigrationOwnerSuggestionService = class MigrationOwnerSuggestionService {
    constructor(activityEventRepository, workflowPublishHistoryRepository, workflowHistoryRepository, sharedWorkflowRepository, projectRelationRepository, userRepository) {
        this.activityEventRepository = activityEventRepository;
        this.workflowPublishHistoryRepository = workflowPublishHistoryRepository;
        this.workflowHistoryRepository = workflowHistoryRepository;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.projectRelationRepository = projectRelationRepository;
        this.userRepository = userRepository;
    }
    async suggestOwners(workflowIds) {
        if (workflowIds.length === 0)
            return [];
        const users = await this.loadEligibleUsers();
        const latestByWorkflow = await this.findLatestAttributedActivity(workflowIds, users);
        const unresolved = workflowIds.filter((workflowId) => !latestByWorkflow.has(workflowId));
        const fallbackByWorkflow = await this.findProjectOwners(unresolved, users);
        const suggestions = [];
        for (const workflowId of workflowIds) {
            const userId = latestByWorkflow.get(workflowId) ?? fallbackByWorkflow.get(workflowId);
            if (userId)
                suggestions.push({ workflowId, userId });
        }
        return suggestions;
    }
    async loadEligibleUsers() {
        const all = await this.userRepository.findAllWithRoleAndAuthIdentities();
        const byId = new Map();
        const idsByName = new Map();
        for (const user of all) {
            if (!(0, workflow_owner_1.canOwnFindings)(user))
                continue;
            byId.set(user.id, user);
            const name = `${user.firstName} ${user.lastName}`;
            idsByName.set(name, [...(idsByName.get(name) ?? []), user.id]);
        }
        return { byId, idsByName };
    }
    async findLatestAttributedActivity(workflowIds, users) {
        const limit = exports.RECENT_ACTIONS_PER_WORKFLOW;
        const [activity, publishes, versions] = await Promise.all([
            this.activityEventRepository.findRecentAttributedByResource('workflow', workflowIds, limit),
            this.workflowPublishHistoryRepository.findRecentAttributedByWorkflowIds(workflowIds, limit),
            this.workflowHistoryRepository.findRecentAuthorsByWorkflowIds(workflowIds, limit),
        ]);
        const latest = new Map();
        for (const workflowId of workflowIds) {
            const candidates = [
                ...(activity.get(workflowId) ?? []),
                ...(publishes.get(workflowId) ?? []),
                ...(versions.get(workflowId) ?? []).flatMap((version) => {
                    const userId = resolveAuthor(version.authors, users);
                    return userId ? [{ userId, at: version.at }] : [];
                }),
            ];
            const newest = candidates
                .filter((candidate) => users.byId.has(candidate.userId))
                .sort((a, b) => b.at.getTime() - a.at.getTime())[0];
            if (newest)
                latest.set(workflowId, newest.userId);
        }
        return latest;
    }
    async findProjectOwners(workflowIds, users) {
        const owners = new Map();
        if (workflowIds.length === 0)
            return owners;
        const projectByWorkflow = await this.sharedWorkflowRepository.findOwnerProjectsByWorkflowIds(workflowIds);
        const projectIds = [...new Set([...projectByWorkflow.values()].map((project) => project.id))];
        const [personalOwners, adminsByProject] = await Promise.all([
            this.projectRelationRepository.getPersonalProjectOwners(projectIds),
            this.projectRelationRepository.findAdminUserIdsByProjectIds(projectIds),
        ]);
        const personalOwnerByProject = new Map(personalOwners.map((relation) => [relation.projectId, relation.userId]));
        for (const [workflowId, project] of projectByWorkflow) {
            const candidates = project.type === 'personal'
                ? [personalOwnerByProject.get(project.id)]
                : (adminsByProject.get(project.id) ?? []);
            const userId = candidates.find((id) => !!id && users.byId.has(id));
            if (userId)
                owners.set(workflowId, userId);
        }
        return owners;
    }
};
exports.MigrationOwnerSuggestionService = MigrationOwnerSuggestionService;
exports.MigrationOwnerSuggestionService = MigrationOwnerSuggestionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.ActivityEventRepository, db_1.WorkflowPublishHistoryRepository, db_1.WorkflowHistoryRepository, db_1.SharedWorkflowRepository, db_1.ProjectRelationRepository, db_1.UserRepository])
], MigrationOwnerSuggestionService);
function resolveAuthor(authors, users) {
    const name = authors.endsWith(MCP_AUTHOR_SUFFIX)
        ? authors.slice(0, -MCP_AUTHOR_SUFFIX.length)
        : authors;
    const ids = users.idsByName.get(name);
    return ids?.length === 1 ? ids[0] : undefined;
}
//# sourceMappingURL=migration-owner-suggestion.service.js.map