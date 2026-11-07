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
exports.VariablesPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const project_mapper_1 = require("../../../public-api/v1/shared/project.mapper");
const pagination_service_1 = require("../../../public-api/v1/shared/services/pagination.service");
const variables_service_ee_1 = require("../../../environments.ee/variables/variables.service.ee");
const tags = ['Variables'];
function toVariablePublic(variable) {
    return {
        id: variable.id,
        key: variable.key,
        value: variable.value ?? '',
        type: variable.type,
        project: variable.project ? (0, project_mapper_1.toPublicProject)(variable.project) : null,
    };
}
let VariablesPublicController = class VariablesPublicController {
    constructor(variablesService) {
        this.variablesService = variablesService;
    }
    async getVariables(req, _res, query) {
        const { offset, limit } = (0, pagination_service_1.resolveOffsetPagination)(query);
        const { projectId, state } = query;
        const variables = await this.variablesService.getAllForUser(req.user, {
            state,
            projectId: projectId === api_types_1.GLOBAL_PROJECT_ID_FILTER ? null : projectId,
        });
        const { data, nextCursor } = (0, pagination_service_1.paginateArray)(variables, { offset, limit });
        return { data: data.map(toVariablePublic), nextCursor };
    }
    async createVariable(req, _res, payload) {
        const { key, value, projectId } = payload;
        await this.variablesService.create(req.user, {
            key,
            value,
            type: api_types_1.VARIABLE_TYPE_DEFAULT,
            projectId,
        });
    }
    async updateVariable(req, _res, id, payload) {
        const { key, value, projectId } = payload;
        await this.variablesService.update(req.user, id, {
            key,
            value,
            projectId,
        });
    }
    async deleteVariable(req, _res, id) {
        await this.variablesService.deleteForUser(req.user, id);
    }
};
exports.VariablesPublicController = VariablesPublicController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.VARIABLES),
    (0, decorators_1.ApiKeyScope)('variable:list'),
    (0, decorators_1.ApiSummary)('Retrieve variables'),
    (0, decorators_1.ApiDescription)('Retrieve variables from your instance.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.VariableListPublicDto),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListVariablesQueryDto]),
    __metadata("design:returntype", Promise)
], VariablesPublicController.prototype, "getVariables", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.VARIABLES),
    (0, decorators_1.ApiKeyScope)('variable:create'),
    (0, decorators_1.ApiSummary)('Create a variable'),
    (0, decorators_1.ApiDescription)('Create a variable in your instance.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(201),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateVariablePublicDto]),
    __metadata("design:returntype", Promise)
], VariablesPublicController.prototype, "createVariable", null);
__decorate([
    (0, decorators_1.Put)('/:id'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.VARIABLES),
    (0, decorators_1.ApiKeyScope)('variable:update'),
    (0, decorators_1.ApiSummary)('Update a variable'),
    (0, decorators_1.ApiDescription)('Update a variable from your instance.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(204),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('id', api_types_1.variableIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateVariablePublicDto]),
    __metadata("design:returntype", Promise)
], VariablesPublicController.prototype, "updateVariable", null);
__decorate([
    (0, decorators_1.Delete)('/:id'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.VARIABLES),
    (0, decorators_1.ApiKeyScope)('variable:delete'),
    (0, decorators_1.ApiSummary)('Delete a variable'),
    (0, decorators_1.ApiDescription)('Delete a variable from your instance.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(204),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('id', api_types_1.variableIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], VariablesPublicController.prototype, "deleteVariable", null);
exports.VariablesPublicController = VariablesPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/variables'),
    __metadata("design:paramtypes", [variables_service_ee_1.VariablesService])
], VariablesPublicController);
//# sourceMappingURL=variables.public.controller.js.map