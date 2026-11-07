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
exports.WorkflowPushNotifier = void 0;
const di_1 = require("@n8n/di");
const push_1 = require("../push");
const backend_services_1 = require("@n8n/backend-services");
let WorkflowPushNotifier = class WorkflowPushNotifier {
    constructor(push, workflowSharingService) {
        this.push = push;
        this.workflowSharingService = workflowSharingService;
    }
    async notify(workflowId, pushMsg) {
        const userIds = await this.workflowSharingService.getUserIdsWithAccessToWorkflowSafe(workflowId);
        this.push.sendToUsers(pushMsg, userIds);
    }
};
exports.WorkflowPushNotifier = WorkflowPushNotifier;
exports.WorkflowPushNotifier = WorkflowPushNotifier = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [push_1.Push, backend_services_1.WorkflowSharingService])
], WorkflowPushNotifier);
//# sourceMappingURL=workflow-push-notifier.service.js.map