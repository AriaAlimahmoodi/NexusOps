"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyInfrastructureModule = void 0;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const policy_enforcement_service_1 = require("../../policy/policy-enforcement.service");
let PolicyInfrastructureModule = class PolicyInfrastructureModule {
    async init() {
        const { PolicyDecisionService } = await import('./policy-decision.service.js');
        di_1.Container.get(policy_enforcement_service_1.PolicyEnforcementService).setImplementation(di_1.Container.get(PolicyDecisionService));
        await import('./policy-lifecycle-handler.js');
    }
};
exports.PolicyInfrastructureModule = PolicyInfrastructureModule;
exports.PolicyInfrastructureModule = PolicyInfrastructureModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'policy-infrastructure' })
], PolicyInfrastructureModule);
//# sourceMappingURL=policy-infrastructure.module.js.map