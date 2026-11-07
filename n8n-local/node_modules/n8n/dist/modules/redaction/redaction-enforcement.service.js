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
exports.RedactionEnforcementService = void 0;
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const instance_redaction_enforcement_service_1 = require("./instance-redaction-enforcement.service");
const redaction_policy_1 = require("./redaction-policy");
let RedactionEnforcementService = class RedactionEnforcementService {
    constructor(instanceRedactionEnforcementService) {
        this.instanceRedactionEnforcementService = instanceRedactionEnforcementService;
    }
    async assertPolicyChangeAllowed(currentPolicy, incomingPolicy) {
        if (incomingPolicy === undefined)
            return;
        if (incomingPolicy === currentPolicy)
            return;
        const floor = await this.instanceRedactionEnforcementService.get();
        if (!(0, redaction_policy_1.policyMeetsFloor)(incomingPolicy, floor)) {
            throw new errors_1.UnprocessableRequestError(redaction_policy_1.REDACTION_FLOOR_VIOLATION_MESSAGE);
        }
    }
    async assertNewPolicyAllowed(incomingPolicy) {
        await this.assertPolicyChangeAllowed(undefined, incomingPolicy);
    }
};
exports.RedactionEnforcementService = RedactionEnforcementService;
exports.RedactionEnforcementService = RedactionEnforcementService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [instance_redaction_enforcement_service_1.InstanceRedactionEnforcementService])
], RedactionEnforcementService);
//# sourceMappingURL=redaction-enforcement.service.js.map