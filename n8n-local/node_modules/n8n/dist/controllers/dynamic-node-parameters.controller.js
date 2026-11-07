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
exports.DynamicNodeParametersController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const n8n_core_1 = require("n8n-core");
const auth_service_1 = require("../auth/auth.service");
const dynamic_node_parameters_service_1 = require("../services/dynamic-node-parameters.service");
const workflow_execute_additional_data_1 = require("../workflow-execute-additional-data");
let DynamicNodeParametersController = class DynamicNodeParametersController {
    constructor(dynamicNodeParametersService, authService, executionContextService) {
        this.dynamicNodeParametersService = dynamicNodeParametersService;
        this.authService = authService;
        this.executionContextService = executionContextService;
    }
    async buildExecutionContext(req) {
        const authCookie = this.authService.getCookieToken(req);
        if (authCookie === undefined)
            return undefined;
        const credentials = await this.executionContextService.buildRequestBoundCredentials(authCookie, {
            method: this.authService.getMethod(req),
            endpoint: this.authService.getEndpoint(req),
            browserId: this.authService.getBrowserId(req),
        });
        return { version: 1, establishedAt: Date.now(), source: 'internal', credentials };
    }
    async getOptions(req, _res, payload) {
        await this.dynamicNodeParametersService.refineResourceIds(req.user, payload);
        const { credentials, currentNodeParameters, nodeTypeAndVersion, path, methodName, loadOptions, projectId, } = payload;
        const additionalData = await (0, workflow_execute_additional_data_1.getBase)({
            userId: req.user.id,
            projectId,
            currentNodeParameters,
        });
        additionalData.dataTableProjectId = projectId;
        additionalData.executionContext = await this.buildExecutionContext(req);
        if (methodName) {
            return await this.dynamicNodeParametersService.getOptionsViaMethodName(methodName, path, additionalData, nodeTypeAndVersion, currentNodeParameters, credentials);
        }
        if (loadOptions) {
            return await this.dynamicNodeParametersService.getOptionsViaLoadOptionsByPath(path, additionalData, nodeTypeAndVersion, currentNodeParameters, credentials);
        }
        return [];
    }
    async getResourceLocatorResults(req, _res, payload) {
        await this.dynamicNodeParametersService.refineResourceIds(req.user, payload);
        const { path, methodName, filter, paginationToken, credentials, currentNodeParameters, nodeTypeAndVersion, projectId, } = payload;
        const additionalData = await (0, workflow_execute_additional_data_1.getBase)({
            userId: req.user.id,
            projectId,
            currentNodeParameters,
        });
        additionalData.dataTableProjectId = projectId;
        additionalData.executionContext = await this.buildExecutionContext(req);
        return await this.dynamicNodeParametersService.getResourceLocatorResults(methodName, path, additionalData, nodeTypeAndVersion, currentNodeParameters, credentials, filter, paginationToken);
    }
    async getResourceMappingFields(req, _res, payload) {
        await this.dynamicNodeParametersService.refineResourceIds(req.user, payload);
        const { path, methodName, credentials, currentNodeParameters, nodeTypeAndVersion, projectId } = payload;
        const additionalData = await (0, workflow_execute_additional_data_1.getBase)({
            userId: req.user.id,
            projectId,
            currentNodeParameters,
        });
        additionalData.dataTableProjectId = projectId;
        additionalData.executionContext = await this.buildExecutionContext(req);
        return await this.dynamicNodeParametersService.getResourceMappingFields(methodName, path, additionalData, nodeTypeAndVersion, currentNodeParameters, credentials);
    }
    async getLocalResourceMappingFields(req, _res, payload) {
        await this.dynamicNodeParametersService.refineResourceIds(req.user, payload);
        const { path, methodName, currentNodeParameters, nodeTypeAndVersion, projectId } = payload;
        const additionalData = await (0, workflow_execute_additional_data_1.getBase)({
            userId: req.user.id,
            currentNodeParameters,
            projectId,
        });
        return await this.dynamicNodeParametersService.getLocalResourceMappingFields(methodName, path, additionalData, nodeTypeAndVersion);
    }
    async getActionResult(req, _res, payload) {
        await this.dynamicNodeParametersService.refineResourceIds(req.user, payload);
        const { currentNodeParameters, nodeTypeAndVersion, path, credentials, handler, payload: actionPayload, projectId, } = payload;
        const additionalData = await (0, workflow_execute_additional_data_1.getBase)({
            userId: req.user.id,
            projectId,
            currentNodeParameters,
        });
        additionalData.executionContext = await this.buildExecutionContext(req);
        return await this.dynamicNodeParametersService.getActionResult(handler, path, additionalData, nodeTypeAndVersion, currentNodeParameters, actionPayload, credentials);
    }
};
exports.DynamicNodeParametersController = DynamicNodeParametersController;
__decorate([
    (0, decorators_1.Post)('/options'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, api_types_1.OptionsRequestDto]),
    __metadata("design:returntype", Promise)
], DynamicNodeParametersController.prototype, "getOptions", null);
__decorate([
    (0, decorators_1.Post)('/resource-locator-results'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, api_types_1.ResourceLocatorRequestDto]),
    __metadata("design:returntype", Promise)
], DynamicNodeParametersController.prototype, "getResourceLocatorResults", null);
__decorate([
    (0, decorators_1.Post)('/resource-mapper-fields'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, api_types_1.ResourceMapperFieldsRequestDto]),
    __metadata("design:returntype", Promise)
], DynamicNodeParametersController.prototype, "getResourceMappingFields", null);
__decorate([
    (0, decorators_1.Post)('/local-resource-mapper-fields'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, api_types_1.ResourceMapperFieldsRequestDto]),
    __metadata("design:returntype", Promise)
], DynamicNodeParametersController.prototype, "getLocalResourceMappingFields", null);
__decorate([
    (0, decorators_1.Post)('/action-result'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, api_types_1.ActionResultRequestDto]),
    __metadata("design:returntype", Promise)
], DynamicNodeParametersController.prototype, "getActionResult", null);
exports.DynamicNodeParametersController = DynamicNodeParametersController = __decorate([
    (0, decorators_1.RestController)('/dynamic-node-parameters'),
    __metadata("design:paramtypes", [dynamic_node_parameters_service_1.DynamicNodeParametersService, auth_service_1.AuthService, n8n_core_1.ExecutionContextService])
], DynamicNodeParametersController);
//# sourceMappingURL=dynamic-node-parameters.controller.js.map