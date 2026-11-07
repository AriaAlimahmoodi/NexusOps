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
exports.ScimModule = void 0;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
let ScimModule = class ScimModule {
    async init() {
        await import('./scim.controller.js');
        await import('./scim-discovery.controller.js');
        await import('./scim-token.controller.js');
    }
    async settings() {
        const { ScimSettingsService } = await import('./scim-settings.service.js');
        return { scimEnabled: await di_1.Container.get(ScimSettingsService).isEnabled() };
    }
    async shutdown() { }
};
exports.ScimModule = ScimModule;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScimModule.prototype, "shutdown", null);
exports.ScimModule = ScimModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'scim', licenseFlag: 'feat:scim', instanceTypes: ['main'] })
], ScimModule);
//# sourceMappingURL=scim.module.js.map