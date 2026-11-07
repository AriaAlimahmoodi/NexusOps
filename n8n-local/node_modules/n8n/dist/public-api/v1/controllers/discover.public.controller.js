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
exports.DiscoverPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const discover_service_1 = require("../../../public-api/v1/handlers/discover/discover.service");
let DiscoverPublicController = class DiscoverPublicController {
    async getDiscover(req, _res, query) {
        const scopes = req.tokenGrant?.apiKeyScopes;
        if (!scopes) {
            throw new errors_1.UnauthenticatedError('Unauthorized');
        }
        return {
            data: await (0, discover_service_1.buildDiscoverResponse)(scopes, {
                includeSchemas: query.include === 'schemas',
                resource: query.resource,
                operation: query.operation,
            }),
        };
    }
};
exports.DiscoverPublicController = DiscoverPublicController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.ApiSummary)('Discover available API capabilities'),
    (0, decorators_1.ApiDescription)("Returns a filtered capability map based on the caller's API key scopes. Each resource includes the operations and endpoints accessible to the authenticated API key. Use query parameters to narrow the response."),
    (0, decorators_1.ApiTags)(['Discover']),
    (0, decorators_1.ApiResponse)(200, api_types_1.DiscoverPublicDto),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.DiscoverQueryPublicDto]),
    __metadata("design:returntype", Promise)
], DiscoverPublicController.prototype, "getDiscover", null);
exports.DiscoverPublicController = DiscoverPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/discover')
], DiscoverPublicController);
//# sourceMappingURL=discover.public.controller.js.map