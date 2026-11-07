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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightsPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const luxon_1 = require("luxon");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const backend_module_insights_1 = require("@n8n/backend-module-insights");
let InsightsPublicController = class InsightsPublicController {
    constructor(insightsService) {
        this.insightsService = insightsService;
    }
    async getInsightsSummary(req, _res, query) {
        const endDate = query.endDate ? new Date(query.endDate) : new Date();
        const startDate = query.startDate
            ? new Date(query.startDate)
            : luxon_1.DateTime.now().minus({ days: 7 }).toJSDate();
        if (query.startDate && query.endDate && startDate > endDate) {
            throw new errors_1.BadRequestError('endDate must be the same as or after startDate');
        }
        try {
            this.insightsService.validateDateFiltersLicense({ startDate, endDate });
        }
        catch (error) {
            if (error instanceof n8n_workflow_1.UserError) {
                throw new errors_1.ForbiddenError(error.message);
            }
            throw error;
        }
        return await this.insightsService.getInsightsSummary({
            user: req.user,
            startDate,
            endDate,
            projectId: query.projectId,
        });
    }
};
exports.InsightsPublicController = InsightsPublicController;
__decorate([
    (0, decorators_1.Get)('/summary'),
    (0, decorators_1.ApiKeyScope)('insights:read'),
    (0, decorators_1.ApiSummary)('Retrieve insights summary'),
    (0, decorators_1.ApiDescription)('Retrieve the insights summary for the selected date range.'),
    (0, decorators_1.ApiTags)(['Insights']),
    (0, decorators_1.ApiResponse)(200, api_types_1.InsightsSummaryPublicDto),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.InsightsSummaryQueryPublicDto]),
    __metadata("design:returntype", Promise)
], InsightsPublicController.prototype, "getInsightsSummary", null);
exports.InsightsPublicController = InsightsPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/insights'),
    __metadata("design:paramtypes", [backend_module_insights_1.InsightsService])
], InsightsPublicController);
//# sourceMappingURL=insights.public.controller.js.map