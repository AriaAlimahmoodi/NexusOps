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
exports.MigrationOwnerAssignmentService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const migration_workflow_owner_repository_1 = require("../database/repositories/migration-workflow-owner.repository");
const migration_owner_suggestion_service_1 = require("./migration-owner-suggestion.service");
const workflow_owner_1 = require("./workflow-owner");
let MigrationOwnerAssignmentService = class MigrationOwnerAssignmentService {
    constructor(workflowRepository, userRepository, ownerRepository, suggestionService, workflowSharingService) {
        this.workflowRepository = workflowRepository;
        this.userRepository = userRepository;
        this.ownerRepository = ownerRepository;
        this.suggestionService = suggestionService;
        this.workflowSharingService = workflowSharingService;
    }
    async assign(workflowId, userId, assignedBy) {
        await this.ensureWorkflowExists(workflowId);
        const user = await this.findUser(userId);
        if (!user)
            throw new errors_1.NotFoundError(`User with ID '${userId}' not found.`);
        if (!(0, workflow_owner_1.canOwnFindings)(user)) {
            throw new errors_1.BadRequestError('The user cannot sign in, so they cannot own the workflow');
        }
        const allowedUserIds = await this.workflowSharingService.getUserIdsWithAccessToWorkflow(workflowId);
        if (!allowedUserIds.includes(userId)) {
            throw new errors_1.BadRequestError('The user has no access to the workflow');
        }
        await this.ownerRepository.assign(workflowId, userId, assignedBy.id, {});
        return (0, workflow_owner_1.toWorkflowOwner)(user, 'assigned');
    }
    async candidates(workflowId) {
        await this.ensureWorkflowExists(workflowId);
        const userIds = await this.workflowSharingService.getUserIdsWithAccessToWorkflow(workflowId);
        const users = await this.userRepository.findManyByIds(userIds, {
            includeRole: true,
            includeAuthIdentities: true,
        });
        return users
            .filter(workflow_owner_1.canOwnFindings)
            .map(({ id, firstName, lastName, email }) => ({ id, firstName, lastName, email }));
    }
    async unassign(workflowId) {
        await this.ensureWorkflowExists(workflowId);
        const suggestions = await this.suggestionService.suggestOwners([workflowId]);
        const suggestion = suggestions.find((candidate) => candidate.workflowId === workflowId);
        await this.ownerRepository.resetToSuggestion(workflowId, suggestion?.userId, {});
        const user = suggestion ? await this.findUser(suggestion.userId) : undefined;
        return user ? (0, workflow_owner_1.toWorkflowOwner)(user, 'suggested') : null;
    }
    async ensureWorkflowExists(workflowId) {
        const existing = await this.workflowRepository.findExistingIds([workflowId], {});
        if (existing.length === 0) {
            throw new errors_1.NotFoundError(`Workflow with ID '${workflowId}' not found.`);
        }
    }
    async findUser(userId) {
        const [user] = await this.userRepository.findManyByIds([userId], {
            includeRole: true,
            includeAuthIdentities: true,
        });
        return user;
    }
};
exports.MigrationOwnerAssignmentService = MigrationOwnerAssignmentService;
exports.MigrationOwnerAssignmentService = MigrationOwnerAssignmentService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.WorkflowRepository, db_1.UserRepository, migration_workflow_owner_repository_1.MigrationWorkflowOwnerRepository, migration_owner_suggestion_service_1.MigrationOwnerSuggestionService, backend_services_1.WorkflowSharingService])
], MigrationOwnerAssignmentService);
//# sourceMappingURL=migration-owner-assignment.service.js.map