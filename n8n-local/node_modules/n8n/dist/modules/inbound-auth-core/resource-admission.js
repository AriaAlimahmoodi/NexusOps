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
exports.InboundResourceAdmission = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const inbound_auth_1 = require("@n8n/inbound-auth");
let InboundResourceAdmission = class InboundResourceAdmission extends inbound_auth_1.ResourceAdmission {
    constructor(pipeline, authenticationService, logger) {
        super();
        this.pipeline = pipeline;
        this.authenticationService = authenticationService;
        this.logger = logger;
    }
    async admitBearer(resource, request, token) {
        const inbound = (0, inbound_auth_1.inboundFrom)(resource, { ...request, headers: {} });
        if (!token)
            return this.refuse(inbound, 'no-credential');
        return await this.admit(resource, { ...inbound, credential: { kind: 'bearer', token } });
    }
    async admit(resource, extracted) {
        const authenticated = await this.pipeline.run(extracted);
        if (!authenticated.ok) {
            return { ok: false, reason: authenticated.reason, advertised: advertisedOf(extracted) };
        }
        const context = authenticated.value;
        if (!(await resource.authorize(context.subject))) {
            return this.refuse(extracted, 'insufficient_scope', context);
        }
        return { ok: true, context };
    }
    async challenge({ advertised, reason }) {
        const { challenges } = await this.authenticationService.advertise(advertised);
        const error = reason === 'insufficient_scope' ? 'insufficient_scope' : 'invalid_token';
        return `${challenges[0] ?? 'Bearer'}, error="${error}", error_description="${reason}"`;
    }
    refuse(inbound, reason, context) {
        this.logger.warn('Inbound authentication denied', {
            surface: inbound.surface,
            resource: inbound.resource.url,
            sourceId: context?.subjectClaim?.sourceId,
            authMethod: context?.authMethod,
            userId: context?.subject.id,
            reason,
        });
        return { ok: false, reason, advertised: advertisedOf(inbound), ...(context && { context }) };
    }
};
exports.InboundResourceAdmission = InboundResourceAdmission;
exports.InboundResourceAdmission = InboundResourceAdmission = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [inbound_auth_1.AuthenticationPipeline, inbound_auth_1.AuthenticationService, backend_common_1.Logger])
], InboundResourceAdmission);
function advertisedOf({ surface, resource, acceptedSourceIds }) {
    return { surface, resource, ...(acceptedSourceIds !== undefined && { acceptedSourceIds }) };
}
//# sourceMappingURL=resource-admission.js.map