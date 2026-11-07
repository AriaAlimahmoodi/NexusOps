"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OidcModule = void 0;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
let OidcModule = class OidcModule {
    async init() {
        await import('./oidc.controller.ee.js');
        const { OidcService } = await import('./oidc.service.ee.js');
        await di_1.Container.get(OidcService).init();
    }
};
exports.OidcModule = OidcModule;
exports.OidcModule = OidcModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'sso-oidc', licenseFlag: 'feat:oidc', instanceTypes: ['main'] })
], OidcModule);
//# sourceMappingURL=sso-oidc.module.js.map