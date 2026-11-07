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
exports.WorkflowScheduledJobOwner = void 0;
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
let WorkflowScheduledJobOwner = class WorkflowScheduledJobOwner {
    constructor(publishedVersions) {
        this.publishedVersions = publishedVersions;
        this.ownerType = constants_1.ScheduledJobOwnerType.Workflow;
    }
    member(workflowId, nodeId) {
        return { ownerType: this.ownerType, ownerId: workflowId, ownerMemberId: nodeId };
    }
    ref(workflowId) {
        return { ownerType: this.ownerType, ownerId: workflowId };
    }
    async findExisting(ownerIds) {
        return await this.publishedVersions.findPublishedWorkflowIds(ownerIds);
    }
};
exports.WorkflowScheduledJobOwner = WorkflowScheduledJobOwner;
exports.WorkflowScheduledJobOwner = WorkflowScheduledJobOwner = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.WorkflowPublishedVersionRepository])
], WorkflowScheduledJobOwner);
//# sourceMappingURL=workflow-scheduled-job-owner.js.map