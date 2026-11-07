"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BreakingChangesModule = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
let BreakingChangesModule = class BreakingChangesModule {
    async init() {
        if (!api_types_1.MIGRATION_REPORT_TARGET_VERSION)
            return;
        await import('./rules/index.js');
        const { BreakingChangeService } = await import('./breaking-changes.service.js');
        di_1.Container.get(BreakingChangeService).registerRules();
        const { MigrationRegistry } = await import('./breaking-changes.migration-registry.service.js');
        di_1.Container.get(MigrationRegistry).registerAll();
        await import('./breaking-changes.controller.js');
        const { MigrationFindingSyncListener } = await import('./sync/migration-finding-sync.listener.js');
        di_1.Container.get(MigrationFindingSyncListener).init();
    }
    async entities() {
        const { MigrationFinding } = await import('./database/entities/migration-finding.entity.js');
        const { MigrationFindingSync } = await import('./database/entities/migration-finding-sync.entity.js');
        const { MigrationWorkflowOwner } = await import('./database/entities/migration-workflow-owner.entity.js');
        return [MigrationFinding, MigrationFindingSync, MigrationWorkflowOwner];
    }
};
exports.BreakingChangesModule = BreakingChangesModule;
exports.BreakingChangesModule = BreakingChangesModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'breaking-changes', instanceTypes: ['main'] })
], BreakingChangesModule);
//# sourceMappingURL=breaking-changes.module.js.map