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
exports.OwnershipTransferService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const credentials_service_1 = require("../../credentials/credentials.service");
const policy_enforcement_service_1 = require("../../policy/policy-enforcement.service");
const folder_service_1 = require("../../services/folder.service");
const ownership_service_1 = require("../../services/ownership.service");
const workflow_service_1 = require("../../workflows/workflow.service");
let OwnershipTransferService = class OwnershipTransferService {
    constructor(userRepository, workflowService, credentialsService, folderService, ownershipService, transferHandlers, sharedWorkflowRepository, workflowRepository, sharedCredentialsRepository, policyEnforcementService) {
        this.userRepository = userRepository;
        this.workflowService = workflowService;
        this.credentialsService = credentialsService;
        this.folderService = folderService;
        this.ownershipService = ownershipService;
        this.transferHandlers = transferHandlers;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.workflowRepository = workflowRepository;
        this.sharedCredentialsRepository = sharedCredentialsRepository;
        this.policyEnforcementService = policyEnforcementService;
    }
    async enforceTransferPolicy(fromProjectId, toProjectId, actor) {
        if (this.policyEnforcementService.hasChecksFor('workflowTransfer')) {
            const ownedWorkflows = await this.sharedWorkflowRepository.find({
                select: { workflowId: true },
                where: { projectId: fromProjectId, role: 'workflow:owner' },
            });
            const workflows = await this.workflowRepository.findByIds(ownedWorkflows.map(({ workflowId }) => workflowId), { fields: ['name', 'nodes'] });
            for (const workflow of workflows) {
                await this.policyEnforcementService.enforceWorkflowTransfer({ workflow, targetProjectId: toProjectId }, actor);
            }
        }
        if (this.policyEnforcementService.hasChecksFor('credentialTransfer')) {
            const credentials = await this.sharedCredentialsRepository.findOwnedCredentialsByProjects([
                fromProjectId,
            ]);
            for (const { id, type } of credentials) {
                await this.policyEnforcementService.enforceCredentialTransfer({ credential: { id, type }, targetProjectId: toProjectId }, actor);
            }
        }
    }
    async transferAllResources(fromProjectIds, toProjectId) {
        const transferredWorkflowIds = [];
        await this.userRepository.manager.transaction(async (trx) => {
            for (const fromProjectId of fromProjectIds) {
                transferredWorkflowIds.push(...(await this.workflowService.transferAll(fromProjectId, toProjectId, trx)));
                await this.credentialsService.transferAll(fromProjectId, toProjectId, trx);
                await this.folderService.transferAllFoldersToProject(fromProjectId, toProjectId, trx);
                for (const handler of this.transferHandlers.getAll()) {
                    await handler.transferAll(fromProjectId, toProjectId, trx);
                }
            }
        });
        await this.ownershipService.invalidateWorkflowProjectCacheByIds(transferredWorkflowIds);
    }
    async deleteModuleOwnedResources(projectIds) {
        for (const projectId of projectIds) {
            for (const handler of this.transferHandlers.getAll()) {
                await handler.deleteAll(projectId);
            }
        }
    }
};
exports.OwnershipTransferService = OwnershipTransferService;
exports.OwnershipTransferService = OwnershipTransferService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.UserRepository, workflow_service_1.WorkflowService, credentials_service_1.CredentialsService, folder_service_1.FolderService, ownership_service_1.OwnershipService, backend_services_1.OwnershipTransferHandlerRegistry, db_1.SharedWorkflowRepository, db_1.WorkflowRepository, db_1.SharedCredentialsRepository, policy_enforcement_service_1.PolicyEnforcementService])
], OwnershipTransferService);
//# sourceMappingURL=ownership-transfer.service.js.map