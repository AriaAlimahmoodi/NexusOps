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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceVersionHistoryController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const instance_version_history_service_1 = require("./instance-version-history.service");
let InstanceVersionHistoryController = class InstanceVersionHistoryController {
    constructor(service) {
        this.service = service;
    }
    async getMinVersionSince(_req, _res, query) {
        const version = await this.service.getMinVersionSince(query.since);
        return { version: version ?? null };
    }
    async getDateSinceVersion(_req, _res, query) {
        const date = await this.service.getDateSinceContinuouslyAtLeastVersion({
            major: query.major,
            minor: query.minor,
            patch: query.patch,
        });
        return { date: date?.toISOString() ?? null };
    }
    async getCurrentVersionDate() {
        const result = await this.service.getCurrentVersionDate();
        if (!result)
            return { version: null, createdAt: null };
        return {
            version: { major: result.major, minor: result.minor, patch: result.patch },
            createdAt: result.createdAt.toISOString(),
        };
    }
    async getFirstAdoption(_req, _res, query) {
        const date = await this.service.getFirstAdoptionDate({
            major: query.major,
            minor: query.minor,
            patch: query.patch,
        });
        return { date: date?.toISOString() ?? null };
    }
};
exports.InstanceVersionHistoryController = InstanceVersionHistoryController;
__decorate([
    (0, decorators_1.Get)('/min-version-since'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.VersionSinceDateQueryDto]),
    __metadata("design:returntype", Promise)
], InstanceVersionHistoryController.prototype, "getMinVersionSince", null);
__decorate([
    (0, decorators_1.Get)('/date-since-version'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.VersionQueryDto]),
    __metadata("design:returntype", Promise)
], InstanceVersionHistoryController.prototype, "getDateSinceVersion", null);
__decorate([
    (0, decorators_1.Get)('/current'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InstanceVersionHistoryController.prototype, "getCurrentVersionDate", null);
__decorate([
    (0, decorators_1.Get)('/first-adoption'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.VersionQueryDto]),
    __metadata("design:returntype", Promise)
], InstanceVersionHistoryController.prototype, "getFirstAdoption", null);
exports.InstanceVersionHistoryController = InstanceVersionHistoryController = __decorate([
    (0, decorators_1.RestController)('/instance-version-history'),
    __metadata("design:paramtypes", [instance_version_history_service_1.InstanceVersionHistoryService])
], InstanceVersionHistoryController);
//# sourceMappingURL=instance-version-history.controller.js.map