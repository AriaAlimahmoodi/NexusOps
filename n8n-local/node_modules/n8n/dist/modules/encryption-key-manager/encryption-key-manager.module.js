"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionKeyManagerModule = void 0;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
let EncryptionKeyManagerModule = class EncryptionKeyManagerModule {
    async init() {
        const { isKeyRotationEnabled } = await import('../../encryption/key-rotation-flag.js');
        if (isKeyRotationEnabled() && di_1.Container.get(n8n_core_1.InstanceSettings).instanceType === 'main') {
            await import('./encryption-key.controller.js');
        }
    }
    async settings() {
        const { isKeyRotationEnabled } = await import('../../encryption/key-rotation-flag.js');
        return { rotationEnabled: isKeyRotationEnabled() };
    }
};
exports.EncryptionKeyManagerModule = EncryptionKeyManagerModule;
exports.EncryptionKeyManagerModule = EncryptionKeyManagerModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'encryption-key-manager' })
], EncryptionKeyManagerModule);
//# sourceMappingURL=encryption-key-manager.module.js.map