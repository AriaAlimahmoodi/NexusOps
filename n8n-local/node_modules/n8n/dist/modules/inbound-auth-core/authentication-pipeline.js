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
exports.InboundAuthPipeline = void 0;
const di_1 = require("@n8n/di");
const backend_common_1 = require("@n8n/backend-common");
const inbound_auth_1 = require("@n8n/inbound-auth");
let InboundAuthPipeline = class InboundAuthPipeline extends inbound_auth_1.AuthenticationPipeline {
    constructor(logger, authenticationService, identityService) {
        super();
        this.logger = logger;
        this.authenticationService = authenticationService;
        this.identityService = identityService;
    }
    async run(extracted) {
        const verified = await this.authenticationService.authenticate(extracted);
        if (!verified.ok) {
            return this.reject(extracted, verified);
        }
        const context = await this.identityService.identify(verified.value);
        if (!context.ok) {
            return this.reject(extracted, context, verified.value.source.id);
        }
        this.logger.info('Inbound authentication accepted', {
            surface: extracted.surface,
            resource: extracted.resource.url,
            sourceId: verified.value.source.id,
            authMethod: context.value.authMethod,
            userId: context.value.subject.id,
        });
        return context;
    }
    reject(extracted, rejection, sourceId) {
        this.logger.warn('Inbound authentication rejected', {
            surface: extracted.surface,
            resource: extracted.resource.url,
            reason: rejection.reason,
            detail: rejection.detail,
            sourceId,
        });
        return rejection;
    }
};
exports.InboundAuthPipeline = InboundAuthPipeline;
exports.InboundAuthPipeline = InboundAuthPipeline = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, inbound_auth_1.AuthenticationService, inbound_auth_1.IdentityService])
], InboundAuthPipeline);
//# sourceMappingURL=authentication-pipeline.js.map