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
exports.WorkflowReviewPolicyService = void 0;
const api_types_1 = require("@n8n/api-types");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const workflow_reviews_1 = require("../constants/workflow-reviews");
const DEFAULT_POLICY = { enabled: false };
let WorkflowReviewPolicyService = class WorkflowReviewPolicyService {
    constructor(settingsRepository) {
        this.settingsRepository = settingsRepository;
    }
    async get() {
        const row = await this.settingsRepository.findByKey(workflow_reviews_1.WORKFLOW_REVIEW_POLICY_SETTINGS_KEY);
        if (!row) {
            return DEFAULT_POLICY;
        }
        const parsed = api_types_1.workflowReviewsPolicySchema.safeParse((0, n8n_workflow_1.jsonParse)(row.value, { fallbackValue: DEFAULT_POLICY }));
        if (!parsed.success) {
            return DEFAULT_POLICY;
        }
        return parsed.data;
    }
    async set(enabled) {
        const parsed = api_types_1.workflowReviewsPolicySchema.safeParse({ enabled });
        if (!parsed.success) {
            throw new n8n_workflow_1.UserError('Invalid workflow reviews settings');
        }
        await this.settingsRepository.upsert({
            key: workflow_reviews_1.WORKFLOW_REVIEW_POLICY_SETTINGS_KEY,
            value: JSON.stringify(parsed.data),
            loadOnStartup: true,
        }, ['key']);
        return parsed.data;
    }
};
exports.WorkflowReviewPolicyService = WorkflowReviewPolicyService;
exports.WorkflowReviewPolicyService = WorkflowReviewPolicyService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.SettingsRepository])
], WorkflowReviewPolicyService);
//# sourceMappingURL=workflow-review-policy.service.js.map