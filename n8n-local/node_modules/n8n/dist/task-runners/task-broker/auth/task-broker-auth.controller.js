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
exports.TaskBrokerAuthController = void 0;
const di_1 = require("@n8n/di");
const task_broker_auth_schema_1 = require("./task-broker-auth.schema");
const task_broker_auth_service_1 = require("./task-broker-auth.service");
const errors_1 = require("@n8n/errors");
let TaskBrokerAuthController = class TaskBrokerAuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async createGrantToken(req) {
        const result = await task_broker_auth_schema_1.taskBrokerAuthRequestBodySchema.safeParseAsync(req.body);
        if (!result.success) {
            throw new errors_1.BadRequestError(result.error.errors[0].code);
        }
        const { token: authToken } = result.data;
        if (!this.authService.isValidAuthToken(authToken)) {
            throw new errors_1.ForbiddenError();
        }
        const grantToken = await this.authService.createGrantToken();
        return {
            token: grantToken,
        };
    }
    async validateUpgradeRequest(authHeader) {
        const result = task_broker_auth_schema_1.bearerTokenSchema.safeParse(authHeader);
        if (!result.success) {
            return {
                isValid: false,
                statusCode: 401,
                reason: 'missing or invalid Authorization header',
            };
        }
        const grantToken = result.data;
        const { isValid, boundRunnerId } = await this.authService.tryConsumeGrantToken(grantToken);
        if (!isValid) {
            return {
                isValid: false,
                statusCode: 403,
                reason: 'invalid or expired grant token',
            };
        }
        return { isValid: true, statusCode: 200, ...(boundRunnerId && { boundRunnerId }) };
    }
};
exports.TaskBrokerAuthController = TaskBrokerAuthController;
exports.TaskBrokerAuthController = TaskBrokerAuthController = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [task_broker_auth_service_1.TaskBrokerAuthService])
], TaskBrokerAuthController);
//# sourceMappingURL=task-broker-auth.controller.js.map