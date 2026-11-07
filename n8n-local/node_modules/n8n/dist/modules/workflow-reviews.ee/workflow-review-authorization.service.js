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
exports.WorkflowReviewAuthorizationService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const errors_1 = require("@n8n/errors");
const project_service_ee_1 = require("../../services/project.service.ee");
const backend_services_1 = require("@n8n/backend-services");
const workflow_finder_service_1 = require("../../workflows/workflow-finder.service");
const workflow_review_decision_policy_1 = require("./workflow-review-decision-policy");
let WorkflowReviewAuthorizationService = class WorkflowReviewAuthorizationService {
    constructor(workflowFinderService, projectService, roleService, projectRepository, projectRelationRepository, workflowReviewRequestRepository, workflowReviewRequestWorkflowRepository, workflowReviewRequestAuthorRepository, workflowReviewRequestReviewerRepository) {
        this.workflowFinderService = workflowFinderService;
        this.projectService = projectService;
        this.roleService = roleService;
        this.projectRepository = projectRepository;
        this.projectRelationRepository = projectRelationRepository;
        this.workflowReviewRequestRepository = workflowReviewRequestRepository;
        this.workflowReviewRequestWorkflowRepository = workflowReviewRequestWorkflowRepository;
        this.workflowReviewRequestAuthorRepository = workflowReviewRequestAuthorRepository;
        this.workflowReviewRequestReviewerRepository = workflowReviewRequestReviewerRepository;
    }
    async isAdminForProject(user, projectId) {
        if (this.isGlobalAdmin(user)) {
            return true;
        }
        return (await this.findAdminProjectIds(user)).includes(projectId);
    }
    isGlobalAdmin(user) {
        return user.role.slug === permissions_1.GLOBAL_ADMIN_ROLE_SLUG || user.role.slug === permissions_1.GLOBAL_OWNER_ROLE_SLUG;
    }
    async findAdminProjectIds(user) {
        return await this.projectRelationRepository.getAccessibleProjectsByRoles(user.id, [
            permissions_1.PROJECT_ADMIN_ROLE_SLUG,
        ]);
    }
    async resolveInboxVisibility(user) {
        if (this.isGlobalAdmin(user)) {
            return { scope: 'all' };
        }
        const [adminProjectIds, readableProjectIds, readableWorkflowRoles] = await Promise.all([
            this.findAdminProjectIds(user),
            this.resolveReadableProjectIds(user),
            this.roleService.rolesWithScope('workflow', ['workflow:read']),
        ]);
        return {
            scope: 'involved',
            userId: user.id,
            adminProjectIds,
            readableProjectIds,
            readableWorkflowRoles,
        };
    }
    async resolveReadableProjectIds(user) {
        if ((0, permissions_1.hasGlobalScope)(user, ['workflow:read'], { mode: 'allOf' })) {
            return null;
        }
        const [teamProjectIds, personalProject] = await Promise.all([
            this.projectService.getProjectIdsWithScope(user, ['workflow:read']),
            this.projectRepository.getPersonalProjectForUser(user.id),
        ]);
        return personalProject ? [...teamProjectIds, personalProject.id] : teamProjectIds;
    }
    async findReadableRequestOrFail(user, workflowReviewRequestId) {
        const request = await this.workflowReviewRequestRepository.findById(workflowReviewRequestId, {});
        if (!request || !(await this.canAccessRequest(user, request))) {
            throw new errors_1.NotFoundError('Could not find review request');
        }
        const workflowRows = await this.workflowReviewRequestWorkflowRepository.findLinkedWorkflowDetailsByRequestId(request.id);
        const readableWorkflowRows = await this.filterReadableWorkflowRows(user, workflowRows);
        if (workflowRows.length > 0 && readableWorkflowRows.length === 0) {
            throw new errors_1.NotFoundError('Could not find review request');
        }
        return { request, workflowRows, readableWorkflowRows };
    }
    async canAccessRequest(user, request) {
        const visibility = await this.resolveInboxVisibility(user);
        if (visibility.scope === 'all') {
            return true;
        }
        if (visibility.adminProjectIds.includes(request.projectId)) {
            return true;
        }
        const participant = { workflowReviewRequestId: request.id, userId: user.id };
        const [isAuthor, isReviewer] = await Promise.all([
            this.workflowReviewRequestAuthorRepository.isAuthor(participant, {}),
            this.workflowReviewRequestReviewerRepository.isReviewer(participant, {}),
        ]);
        return isAuthor || isReviewer;
    }
    async resolveOpenableRequestIds(user, requests) {
        if (requests.length === 0) {
            return new Set();
        }
        const visibility = await this.resolveInboxVisibility(user);
        if (visibility.scope === 'all') {
            return new Set(requests.map((request) => request.id));
        }
        const adminProjectIds = new Set(visibility.adminProjectIds);
        const openable = new Set(requests
            .filter((request) => adminProjectIds.has(request.projectId))
            .map((request) => request.id));
        const remainingIds = requests.map((request) => request.id).filter((id) => !openable.has(id));
        if (remainingIds.length > 0) {
            const [authoredIds, reviewingIds] = await Promise.all([
                this.workflowReviewRequestAuthorRepository.findRequestIdsForUser(remainingIds, user.id),
                this.workflowReviewRequestReviewerRepository.findRequestIdsForUser(remainingIds, user.id),
            ]);
            for (const id of authoredIds)
                openable.add(id);
            for (const id of reviewingIds)
                openable.add(id);
        }
        return openable;
    }
    async filterReadableWorkflowRows(user, rows) {
        const readable = await Promise.all(rows.map(async (row) => (await this.workflowFinderService.findWorkflowForUser(row.workflowId, user, [
            'workflow:read',
        ]))
            ? row
            : null));
        return readable.filter((row) => row !== null);
    }
    async resolveViewerEligibility(user, access) {
        const { request, workflowRows, readableWorkflowRows } = access;
        const canReadEveryWorkflow = workflowRows.length > 0 && readableWorkflowRows.length === workflowRows.length;
        if (!canReadEveryWorkflow) {
            return {
                canDecide: false,
                decisionIneligibilityReason: 'missing_permission',
                canComment: false,
            };
        }
        const participant = { workflowReviewRequestId: request.id, userId: user.id };
        const [isAuthor, isAssignedReviewer, hasAdminOverride] = await Promise.all([
            this.workflowReviewRequestAuthorRepository.isAuthor(participant, {}),
            this.workflowReviewRequestReviewerRepository.isReviewer(participant, {}),
            this.isAdminForProject(user, request.projectId),
        ]);
        const capability = (0, workflow_review_decision_policy_1.resolveDecisionCapability)({
            canReadEveryWorkflow,
            isAuthor,
            isAssignedReviewer,
            hasAdminOverride,
        });
        return {
            canDecide: capability.allowed,
            decisionIneligibilityReason: capability.allowed ? null : capability.reason,
            canComment: capability.allowed || isAuthor,
        };
    }
};
exports.WorkflowReviewAuthorizationService = WorkflowReviewAuthorizationService;
exports.WorkflowReviewAuthorizationService = WorkflowReviewAuthorizationService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [workflow_finder_service_1.WorkflowFinderService, project_service_ee_1.ProjectService, backend_services_1.RoleService, db_1.ProjectRepository, db_1.ProjectRelationRepository, db_1.WorkflowReviewRequestRepository, db_1.WorkflowReviewRequestWorkflowRepository, db_1.WorkflowReviewRequestAuthorRepository, db_1.WorkflowReviewRequestReviewerRepository])
], WorkflowReviewAuthorizationService);
//# sourceMappingURL=workflow-review-authorization.service.js.map