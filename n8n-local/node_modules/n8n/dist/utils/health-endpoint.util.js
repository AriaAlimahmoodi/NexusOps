"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveBackendHealthEndpointPath = resolveBackendHealthEndpointPath;
exports.resolveFrontendHealthEndpointPath = resolveFrontendHealthEndpointPath;
const node_path_1 = __importDefault(require("node:path"));
function resolveBackendHealthEndpointPath(globalConfig) {
    return globalConfig.endpoints.health;
}
function resolveFrontendHealthEndpointPath(globalConfig) {
    const isHealthEndpointCustomized = process.env.N8N_ENDPOINT_HEALTH !== undefined;
    if (!isHealthEndpointCustomized && globalConfig.path !== '/') {
        return node_path_1.default.posix.join(globalConfig.path, globalConfig.endpoints.health);
    }
    return globalConfig.endpoints.health;
}
//# sourceMappingURL=health-endpoint.util.js.map