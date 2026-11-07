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
exports.EvaluationConfigService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const nanoid_1 = require("nanoid");
const evaluation_api_error_1 = require("./evaluation-api-error");
const evaluation_config_validator_1 = require("./evaluation-config-validator");
let EvaluationConfigService = class EvaluationConfigService {
    constructor(repository, validator, licenseState) {
        this.repository = repository;
        this.validator = validator;
        this.licenseState = licenseState;
    }
    async list(workflowId) {
        return await this.repository.listByWorkflowId(workflowId);
    }
    async get(workflowId, configId) {
        return await this.repository.findByIdAndWorkflowId(configId, workflowId);
    }
    async create(workflowId, workflow, user, dto) {
        const existing = await this.repository.listByWorkflowId(workflowId);
        if (existing.length === 0) {
            const limit = this.licenseState.getMaxWorkflowsWithEvaluations();
            if (limit > 0) {
                const used = await this.repository.countDistinctWorkflowsWithConfigs();
                if (used >= limit) {
                    throw new evaluation_api_error_1.EvaluationApiError('EVALUATION_QUOTA_EXCEEDED', `Evaluation quota exceeded: ${used}/${limit} workflows already have evaluations`);
                }
            }
        }
        await this.runValidator(workflow, user, dto);
        return await this.repository.createForWorkflow((0, nanoid_1.nanoid)(), workflowId, dto);
    }
    async update(workflowId, configId, workflow, user, dto) {
        await this.runValidator(workflow, user, dto);
        const updated = await this.repository.updateForWorkflow(configId, workflowId, dto);
        if (!updated) {
            throw new evaluation_api_error_1.EvaluationApiError('CONFIG_NOT_FOUND', `Evaluation config "${configId}" not found`);
        }
        return updated;
    }
    async delete(workflowId, configId) {
        await this.repository.deleteByIdAndWorkflowId(configId, workflowId);
    }
    async markInvalid(configId, reason) {
        await this.repository.markInvalid(configId, reason);
    }
    async runValidator(workflow, user, dto) {
        const errors = await this.validator.validate({ workflow, config: dto, user });
        if (errors.length > 0) {
            const first = errors[0];
            throw new evaluation_api_error_1.EvaluationApiError(first.code, first.message, first.details);
        }
    }
};
exports.EvaluationConfigService = EvaluationConfigService;
exports.EvaluationConfigService = EvaluationConfigService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.EvaluationConfigRepository, evaluation_config_validator_1.EvaluationConfigValidator, backend_common_1.LicenseState])
], EvaluationConfigService);
//# sourceMappingURL=evaluation-config.service.js.map