"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceCredentialUseRegistry = void 0;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
let InstanceCredentialUseRegistry = class InstanceCredentialUseRegistry {
    constructor() {
        this.uses = new Map();
    }
    register(credentialUse) {
        if (credentialUse.id.trim().length === 0) {
            throw new n8n_workflow_1.UnexpectedError('Instance credential use ID cannot be empty');
        }
        if (credentialUse.id !== credentialUse.id.trim()) {
            throw new n8n_workflow_1.UnexpectedError('Instance credential use ID cannot contain surrounding whitespace');
        }
        if (this.uses.has(credentialUse.id)) {
            throw new n8n_workflow_1.UnexpectedError(`Instance credential use "${credentialUse.id}" is already registered`);
        }
        if (credentialUse.credentialTypes.length === 0) {
            throw new n8n_workflow_1.UnexpectedError(`Instance credential use "${credentialUse.id}" must allow at least one credential type`);
        }
        this.uses.set(credentialUse.id, credentialUse);
    }
    get(credentialUseId) {
        const credentialUse = this.uses.get(credentialUseId);
        if (!credentialUse) {
            throw new n8n_workflow_1.UnexpectedError(`Unknown instance credential use "${credentialUseId}"`);
        }
        return credentialUse;
    }
};
exports.InstanceCredentialUseRegistry = InstanceCredentialUseRegistry;
exports.InstanceCredentialUseRegistry = InstanceCredentialUseRegistry = __decorate([
    (0, di_1.Service)()
], InstanceCredentialUseRegistry);
//# sourceMappingURL=instance-credential-use.registry.js.map