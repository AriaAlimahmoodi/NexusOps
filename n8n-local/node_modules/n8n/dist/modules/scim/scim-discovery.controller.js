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
exports.ScimDiscoveryController = void 0;
const decorators_1 = require("@n8n/decorators");
const scim_route_1 = require("./scim-route");
let ScimDiscoveryController = class ScimDiscoveryController {
    getServiceProviderConfig(_req, res) {
        return res.header('Content-Type', 'application/scim+json').json({
            schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
            documentationUri: 'https://docs.n8n.io/user-management/scim/',
            patch: {
                supported: true,
            },
            bulk: {
                supported: false,
                maxOperations: 0,
                maxPayloadSize: 0,
            },
            filter: {
                supported: true,
                maxResults: 1000,
            },
            changePassword: {
                supported: false,
            },
            sort: {
                supported: false,
            },
            etag: {
                supported: false,
            },
            authenticationSchemes: [
                {
                    type: 'oauthbearertoken',
                    name: 'OAuth Bearer Token',
                    description: 'Authentication scheme using the OAuth Bearer Token Standard',
                    specUri: 'https://tools.ietf.org/html/rfc6750',
                    documentationUri: 'https://docs.n8n.io/user-management/scim/',
                    primary: true,
                },
            ],
        });
    }
    getResourceTypes(_req, res) {
        return res.header('Content-Type', 'application/scim+json').json({
            schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
            totalResults: 1,
            Resources: [
                {
                    schemas: ['urn:ietf:params:scim:schemas:core:2.0:ResourceType'],
                    id: 'User',
                    name: 'User',
                    endpoint: '/Users',
                    description: 'User Account',
                    schema: 'urn:ietf:params:scim:schemas:core:2.0:User',
                },
            ],
        });
    }
    getSchemas(_req, res) {
        return res.header('Content-Type', 'application/scim+json').json({
            schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
            totalResults: 1,
            Resources: [
                {
                    id: 'urn:ietf:params:scim:schemas:core:2.0:User',
                    name: 'User',
                    description: 'User Account',
                    attributes: [
                        {
                            name: 'userName',
                            type: 'string',
                            multiValued: false,
                            required: true,
                            caseExact: false,
                            mutability: 'readWrite',
                            returned: 'default',
                            uniqueness: 'server',
                        },
                        {
                            name: 'name',
                            type: 'complex',
                            multiValued: false,
                            required: false,
                            mutability: 'readWrite',
                            returned: 'default',
                            subAttributes: [
                                {
                                    name: 'givenName',
                                    type: 'string',
                                    multiValued: false,
                                    required: false,
                                    mutability: 'readWrite',
                                    returned: 'default',
                                },
                                {
                                    name: 'familyName',
                                    type: 'string',
                                    multiValued: false,
                                    required: false,
                                    mutability: 'readWrite',
                                    returned: 'default',
                                },
                            ],
                        },
                        {
                            name: 'emails',
                            type: 'complex',
                            multiValued: true,
                            required: false,
                            mutability: 'readWrite',
                            returned: 'default',
                        },
                        {
                            name: 'active',
                            type: 'boolean',
                            multiValued: false,
                            required: false,
                            mutability: 'readWrite',
                            returned: 'default',
                        },
                        {
                            name: 'roles',
                            type: 'complex',
                            multiValued: true,
                            required: false,
                            mutability: 'readWrite',
                            returned: 'default',
                        },
                    ],
                },
            ],
        });
    }
};
exports.ScimDiscoveryController = ScimDiscoveryController;
__decorate([
    (0, decorators_1.Get)('/ServiceProviderConfig', scim_route_1.scimRoute),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ScimDiscoveryController.prototype, "getServiceProviderConfig", null);
__decorate([
    (0, decorators_1.Get)('/ResourceTypes', scim_route_1.scimRoute),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ScimDiscoveryController.prototype, "getResourceTypes", null);
__decorate([
    (0, decorators_1.Get)('/Schemas', scim_route_1.scimRoute),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ScimDiscoveryController.prototype, "getSchemas", null);
exports.ScimDiscoveryController = ScimDiscoveryController = __decorate([
    (0, decorators_1.RootLevelController)('/scim/v2')
], ScimDiscoveryController);
//# sourceMappingURL=scim-discovery.controller.js.map