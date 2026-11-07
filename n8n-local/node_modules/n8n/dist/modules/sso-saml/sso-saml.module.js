"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SamlModule = void 0;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
let SamlModule = class SamlModule {
    async init() {
        await import('./saml.controller.ee.js');
        const { SamlService } = await import('./saml.service.ee.js');
        await di_1.Container.get(SamlService).init();
    }
};
exports.SamlModule = SamlModule;
exports.SamlModule = SamlModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'sso-saml', licenseFlag: 'feat:saml', instanceTypes: ['main'] })
], SamlModule);
//# sourceMappingURL=sso-saml.module.js.map