"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineCredentialsService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const credentials_helper_1 = require("../../credentials-helper");
const credential_not_found_error_1 = require("../../errors/credential-not-found.error");
const errors_1 = require("@n8n/errors");
const pre_execution_checks_1 = require("../../executions/pre-execution-checks");
const WorkflowExecuteAdditionalData = __importStar(require("../../workflow-execute-additional-data"));
function toExecuteData(nodeType) {
    return {
        node: { id: '', name: '', type: nodeType, typeVersion: 0, position: [0, 0], parameters: {} },
        data: {},
        source: null,
    };
}
let EngineCredentialsService = class EngineCredentialsService {
    constructor(permissionChecker, credentialsHelper, logger) {
        this.permissionChecker = permissionChecker;
        this.credentialsHelper = credentialsHelper;
        this.logger = logger;
        this.logger = this.logger.scoped('engine-v2');
    }
    async resolve({ credential, execution, context, consumer, }) {
        const { inaccessibleIds } = await this.permissionChecker.findInaccessible(execution.workflowId, [credential.id], context.userId);
        if (inaccessibleIds.length > 0) {
            this.logger.warn(`Refused credential "${credential.id}" to workflow "${execution.workflowId}" - not shared with its projects`);
            throw new errors_1.ForbiddenError('Credential is not shared with the workflow');
        }
        const additionalData = await WorkflowExecuteAdditionalData.getBase({
            userId: context.userId,
            workflowId: execution.workflowId,
            projectId: context.projectId,
        });
        additionalData.executionId = execution.executionId;
        try {
            return await this.credentialsHelper.getDecrypted(additionalData, { id: credential.id, name: credential.name }, credential.type, execution.mode, toExecuteData(consumer.nodeType));
        }
        catch (error) {
            if (error instanceof credential_not_found_error_1.CredentialNotFoundError)
                throw new errors_1.NotFoundError(error.message);
            throw error;
        }
    }
};
exports.EngineCredentialsService = EngineCredentialsService;
exports.EngineCredentialsService = EngineCredentialsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [pre_execution_checks_1.CredentialsPermissionChecker, credentials_helper_1.CredentialsHelper, backend_common_1.Logger])
], EngineCredentialsService);
//# sourceMappingURL=engine-credentials.service.js.map