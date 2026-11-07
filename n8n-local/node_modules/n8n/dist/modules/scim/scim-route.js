"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scimRoute = void 0;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const scim_auth_middleware_1 = require("./scim-auth.middleware");
const scim_body_parser_1 = require("./scim-body-parser");
const scim_config_1 = require("./scim.config");
const scimAuth = () => di_1.Container.get(scim_auth_middleware_1.ScimAuthMiddleware).getAuthMiddleware();
const scimConfig = di_1.Container.get(scim_config_1.ScimConfig);
exports.scimRoute = {
    skipAuth: true,
    usesTemplates: true,
    allowBots: true,
    middlewares: [scim_body_parser_1.scimBodyParser, scimAuth()],
    ipRateLimit: (0, decorators_1.createIpRateLimit)(scimConfig.rateLimit),
};
//# sourceMappingURL=scim-route.js.map