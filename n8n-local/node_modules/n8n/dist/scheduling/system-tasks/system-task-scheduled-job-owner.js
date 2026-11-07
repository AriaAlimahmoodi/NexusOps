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
exports.SystemTaskScheduledJobOwner = void 0;
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const system_task_version_stamp_1 = require("./system-task-version-stamp");
let SystemTaskScheduledJobOwner = class SystemTaskScheduledJobOwner {
    constructor(jobs) {
        this.jobs = jobs;
        this.ownerType = constants_1.ScheduledJobOwnerType.SystemTask;
        this.durableTaskNames = new Set();
    }
    owner(taskName) {
        return { ownerType: this.ownerType, ownerId: taskName, ownerMemberId: null };
    }
    declareDurable(taskName) {
        this.durableTaskNames.add(taskName);
    }
    async findExisting(ownerIds) {
        const existing = new Set(ownerIds.filter((name) => this.durableTaskNames.has(name)));
        const undeclared = ownerIds.filter((name) => !existing.has(name));
        if (undeclared.length > 0) {
            const rows = await this.jobs.findPayloadsByOwnerIds(this.ownerType, undeclared);
            for (const { ownerId, payload } of rows) {
                if (this.isAlive(ownerId, payload)) {
                    existing.add(ownerId);
                }
            }
        }
        return existing;
    }
    isAlive(ownerId, payload) {
        return this.durableTaskNames.has(ownerId) || (0, system_task_version_stamp_1.stampedByNewerVersion)(payload);
    }
};
exports.SystemTaskScheduledJobOwner = SystemTaskScheduledJobOwner;
exports.SystemTaskScheduledJobOwner = SystemTaskScheduledJobOwner = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.ScheduledJobRepository])
], SystemTaskScheduledJobOwner);
//# sourceMappingURL=system-task-scheduled-job-owner.js.map