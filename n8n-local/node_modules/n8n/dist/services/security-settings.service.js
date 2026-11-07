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
exports.SecuritySettingsService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const instance_redaction_enforcement_service_1 = require("../modules/redaction/instance-redaction-enforcement.service");
let SecuritySettingsService = class SecuritySettingsService {
    constructor(settingsRepository, roleService, workflowRepository, sharedWorkflowRepository, sharedCredentialsRepository, instanceRedactionEnforcementService, eventService) {
        this.settingsRepository = settingsRepository;
        this.roleService = roleService;
        this.workflowRepository = workflowRepository;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.sharedCredentialsRepository = sharedCredentialsRepository;
        this.instanceRedactionEnforcementService = instanceRedactionEnforcementService;
        this.eventService = eventService;
        this.PERSONAL_OWNER_ROLE_SLUG = 'project:personalOwner';
    }
    async getSecuritySettings() {
        const [settings, publishedPersonalWorkflowsCount, sharedPersonalWorkflowsCount, sharedPersonalCredentialsCount, floor,] = await Promise.all([
            this.arePersonalSpaceSettingsEnabled(),
            this.getPublishedPersonalWorkflowsCount(),
            this.getSharedPersonalWorkflowsCount(),
            this.getSharedPersonalCredentialsCount(),
            this.instanceRedactionEnforcementService.get(),
        ]);
        return {
            ...settings,
            publishedPersonalWorkflowsCount,
            sharedPersonalWorkflowsCount,
            sharedPersonalCredentialsCount,
            redactionEnforcement: { floor },
        };
    }
    async updateSecuritySettings(securityPolicyUpdate, actor) {
        const updatedSettings = {};
        const { personalSpacePublishing, personalSpaceSharing, redactionEnforcement } = securityPolicyUpdate;
        if (personalSpacePublishing !== undefined) {
            await this.setPersonalSpaceSetting(permissions_1.PERSONAL_SPACE_PUBLISHING_SETTING, personalSpacePublishing);
            updatedSettings.personalSpacePublishing = personalSpacePublishing;
            this.emitInstancePolicyUpdated(actor, {
                settingName: 'workflow_publishing',
                value: personalSpacePublishing,
            });
        }
        if (personalSpaceSharing !== undefined) {
            await this.setPersonalSpaceSetting(permissions_1.PERSONAL_SPACE_SHARING_SETTING, personalSpaceSharing);
            updatedSettings.personalSpaceSharing = personalSpaceSharing;
            this.emitInstancePolicyUpdated(actor, {
                settingName: 'workflow_sharing',
                value: personalSpaceSharing,
            });
        }
        if (redactionEnforcement !== undefined) {
            const before = await this.instanceRedactionEnforcementService.get();
            const after = redactionEnforcement.floor;
            updatedSettings.redactionEnforcement = { floor: after };
            if (before !== after) {
                await this.instanceRedactionEnforcementService.set(after);
                const user = this.toEventUser(actor);
                this.eventService.emit('redaction-enforcement-updated', { user, before, after });
                this.emitInstancePolicyUpdated(actor, {
                    settingName: 'data_redaction_enforcement_floor',
                    value: after,
                });
            }
        }
        return updatedSettings;
    }
    emitInstancePolicyUpdated(actor, update) {
        const user = this.toEventUser(actor);
        this.eventService.emit('instance-policies-updated', {
            user,
            ...update,
        });
    }
    async setPersonalSpaceSetting(setting, enabled) {
        await this.settingsRepository.upsert({
            key: setting.key,
            value: enabled.toString(),
            loadOnStartup: true,
        }, ['key']);
        if (enabled) {
            await this.roleService.addScopesToRole(this.PERSONAL_OWNER_ROLE_SLUG, setting.scopes);
        }
        else {
            await this.roleService.removeScopesFromRole(this.PERSONAL_OWNER_ROLE_SLUG, setting.scopes);
        }
    }
    async arePersonalSpaceSettingsEnabled() {
        const settingKeys = [permissions_1.PERSONAL_SPACE_PUBLISHING_SETTING.key, permissions_1.PERSONAL_SPACE_SHARING_SETTING.key];
        const rows = await this.settingsRepository.findByKeys(settingKeys);
        const personalSpacePublishingValue = rows.find((r) => r.key === permissions_1.PERSONAL_SPACE_PUBLISHING_SETTING.key)?.value;
        const personalSpaceSharingValue = rows.find((r) => r.key === permissions_1.PERSONAL_SPACE_SHARING_SETTING.key)?.value;
        return {
            personalSpacePublishing: personalSpacePublishingValue !== 'false',
            personalSpaceSharing: personalSpaceSharingValue !== 'false',
        };
    }
    async getPublishedPersonalWorkflowsCount() {
        return await this.workflowRepository.getPublishedPersonalWorkflowsCount();
    }
    async getSharedPersonalWorkflowsCount() {
        return await this.sharedWorkflowRepository.getSharedPersonalWorkflowsCount();
    }
    async getSharedPersonalCredentialsCount() {
        return await this.sharedCredentialsRepository.getSharedPersonalCredentialsCount();
    }
    toEventUser(actor) {
        return {
            id: actor.id,
            email: actor.email,
            firstName: actor.firstName,
            lastName: actor.lastName,
            role: actor.role,
        };
    }
};
exports.SecuritySettingsService = SecuritySettingsService;
exports.SecuritySettingsService = SecuritySettingsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.SettingsRepository, backend_services_1.RoleService, db_1.WorkflowRepository, db_1.SharedWorkflowRepository, db_1.SharedCredentialsRepository, instance_redaction_enforcement_service_1.InstanceRedactionEnforcementService, backend_services_1.EventService])
], SecuritySettingsService);
//# sourceMappingURL=security-settings.service.js.map