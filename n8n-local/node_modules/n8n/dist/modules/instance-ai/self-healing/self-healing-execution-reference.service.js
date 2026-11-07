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
exports.SelfHealingExecutionReferenceService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const engine_v2_execution_reader_service_1 = require("../../../executions/engine-v2-execution-reader.service");
const execution_id_1 = require("../../../executions/execution-id");
const workflow_finder_service_1 = require("../../../workflows/workflow-finder.service");
let SelfHealingExecutionReferenceService = class SelfHealingExecutionReferenceService {
    constructor(executions, engineV2, workflows, logger) {
        this.executions = executions;
        this.engineV2 = engineV2;
        this.workflows = workflows;
        this.logger = logger;
    }
    async getReference(user, workflowId, executionId) {
        try {
            if (!(await this.canReadExecution(user, workflowId)))
                return { status: 'unavailable' };
            const execution = await this.findReference(executionId);
            return execution?.workflowId === workflowId
                ? { status: 'available', id: execution.id }
                : { status: 'unavailable' };
        }
        catch {
            this.logger.warn('Could not load the execution reference for a self-healing result.', {
                workflowId,
                executionId,
            });
            return { status: 'unavailable' };
        }
    }
    async validateReference(user, workflowId, executionId) {
        if (!(await this.canReadExecution(user, workflowId))) {
            throw new errors_1.ForbiddenError('Workflow and execution read access is required.');
        }
        const execution = await this.findReference(executionId);
        if (execution && execution.workflowId !== workflowId) {
            throw new errors_1.BadRequestError('The execution does not belong to this workflow.');
        }
    }
    async canReadExecution(user, workflowId) {
        if (user.disabled)
            return false;
        return !!(await this.workflows.findWorkflowHeadForUser(workflowId, user, [
            'workflow:read',
            'execution:read',
        ]));
    }
    async findReference(executionId) {
        if ((0, execution_id_1.isExecutionIdV2)(executionId)) {
            return await this.engineV2.findReference(executionId);
        }
        const execution = await this.executions.findSingleExecution(executionId, {
            includeData: false,
            includeAnnotation: false,
        });
        return execution ? { id: execution.id, workflowId: execution.workflowId } : undefined;
    }
};
exports.SelfHealingExecutionReferenceService = SelfHealingExecutionReferenceService;
exports.SelfHealingExecutionReferenceService = SelfHealingExecutionReferenceService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.ExecutionRepository, engine_v2_execution_reader_service_1.EngineV2ExecutionReader, workflow_finder_service_1.WorkflowFinderService, backend_common_1.Logger])
], SelfHealingExecutionReferenceService);
//# sourceMappingURL=self-healing-execution-reference.service.js.map