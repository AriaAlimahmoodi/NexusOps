"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceVersionHistoryModule = void 0;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
let InstanceVersionHistoryModule = class InstanceVersionHistoryModule {
    async init() {
        await import('./instance-version-history.controller.js');
        const { InstanceVersionHistoryService } = await import('./instance-version-history.service.js');
        await di_1.Container.get(InstanceVersionHistoryService).init();
    }
    async entities() {
        const { InstanceVersionHistory } = await import('./database/entities/instance-version-history.entity.js');
        return [InstanceVersionHistory];
    }
};
exports.InstanceVersionHistoryModule = InstanceVersionHistoryModule;
exports.InstanceVersionHistoryModule = InstanceVersionHistoryModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'instance-version-history', instanceTypes: ['main'] })
], InstanceVersionHistoryModule);
//# sourceMappingURL=instance-version-history.module.js.map