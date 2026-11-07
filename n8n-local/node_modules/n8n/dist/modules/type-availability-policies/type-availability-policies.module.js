"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeAvailabilityPoliciesModule = void 0;
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const backend_services_1 = require("@n8n/backend-services");
let TypeAvailabilityPoliciesModule = class TypeAvailabilityPoliciesModule {
    async init() {
        await import('./type-availability-policy-instance.controller.js');
        await import('./type-availability-policy-project.controller.js');
        await import('./credential-type-policy-instance.controller.js');
        await import('./credential-type-policy-project.controller.js');
        await import('./available-types.controller.js');
        await import('./available-credential-types.controller.js');
        await import('./node-type-policy.check.js');
        await import('./credential-type-policy.check.js');
        const { NodeTypePolicyRestrictedTypesProvider } = await import('./restricted-node-types.provider.js');
        di_1.Container.get(backend_services_1.RestrictedNodeTypesProviderProxy).registerProvider(di_1.Container.get(NodeTypePolicyRestrictedTypesProvider));
        const { TypeAvailabilityPolicySnapshot } = await import('./type-availability-policy-snapshot.js');
        await di_1.Container.get(TypeAvailabilityPolicySnapshot).start();
    }
    async entities() {
        const { TypeAvailabilityPolicy } = await import('./database/entities/type-availability-policy.entity.js');
        const { TypeAvailabilityPolicyScope } = await import('./database/entities/type-availability-policy-scope.entity.js');
        const { TypeAvailabilityPolicyAttachment } = await import('./database/entities/type-availability-policy-attachment.entity.js');
        return [TypeAvailabilityPolicy, TypeAvailabilityPolicyScope, TypeAvailabilityPolicyAttachment];
    }
};
exports.TypeAvailabilityPoliciesModule = TypeAvailabilityPoliciesModule;
exports.TypeAvailabilityPoliciesModule = TypeAvailabilityPoliciesModule = __decorate([
    (0, decorators_1.BackendModule)({
        name: 'type-availability-policies',
        licenseFlag: constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES,
    })
], TypeAvailabilityPoliciesModule);
//# sourceMappingURL=type-availability-policies.module.js.map