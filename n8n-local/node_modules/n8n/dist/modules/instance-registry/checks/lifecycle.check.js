"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifecycleCheck = void 0;
const decorators_1 = require("@n8n/decorators");
const AUDIT_JOINED = 'n8n.audit.cluster.instance-joined';
const AUDIT_LEFT = 'n8n.audit.cluster.instance-left';
function membershipPayload(instance) {
    return {
        instanceKey: instance.instanceKey,
        hostId: instance.hostId,
        instanceType: instance.instanceType,
        instanceRole: instance.instanceRole,
        version: instance.version,
    };
}
let LifecycleCheck = class LifecycleCheck {
    constructor() {
        this.checkDescription = {
            name: 'lifecycle',
            displayName: 'Cluster membership',
        };
    }
    async run(context) {
        const auditEvents = [];
        for (const joined of context.diff.added) {
            auditEvents.push({
                eventName: AUDIT_JOINED,
                payload: membershipPayload(joined),
            });
        }
        for (const left of context.diff.removed) {
            auditEvents.push({
                eventName: AUDIT_LEFT,
                payload: membershipPayload(left),
            });
        }
        if (auditEvents.length === 0)
            return {};
        return { auditEvents };
    }
};
exports.LifecycleCheck = LifecycleCheck;
exports.LifecycleCheck = LifecycleCheck = __decorate([
    (0, decorators_1.ClusterCheck)()
], LifecycleCheck);
//# sourceMappingURL=lifecycle.check.js.map