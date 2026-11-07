"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDynamicCredentialMiddlewares = void 0;
const di_1 = require("@n8n/di");
const dynamic_credential_service_1 = require("./services/dynamic-credential.service");
const getDynamicCredentialMiddlewares = () => {
    return [di_1.Container.get(dynamic_credential_service_1.DynamicCredentialService).getDynamicCredentialsEndpointsMiddleware()];
};
exports.getDynamicCredentialMiddlewares = getDynamicCredentialMiddlewares;
//# sourceMappingURL=utils.js.map