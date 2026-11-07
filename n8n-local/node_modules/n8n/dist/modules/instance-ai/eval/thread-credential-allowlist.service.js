"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvalThreadCredentialAllowlistService = void 0;
const di_1 = require("@n8n/di");
let EvalThreadCredentialAllowlistService = class EvalThreadCredentialAllowlistService {
    constructor() {
        this.byThread = new Map();
        this.testBypassByThread = new Map();
        this.testTargetsByThread = new Map();
    }
    set(threadId, credentialIds, bypassCredentialTest) {
        this.byThread.set(threadId, [...credentialIds]);
        const allowed = new Set(credentialIds);
        this.testBypassByThread.set(threadId, (bypassCredentialTest ?? []).filter((id) => allowed.has(id)));
    }
    get(threadId) {
        return this.byThread.get(threadId);
    }
    shouldBypassTest(threadId, credentialId) {
        return this.testBypassByThread.get(threadId)?.includes(credentialId) ?? false;
    }
    setTestTarget(threadId, target) {
        const targets = this.testTargetsByThread.get(threadId) ?? new Map();
        targets.set(target.credentialType, { ...target });
        this.testTargetsByThread.set(threadId, targets);
    }
    getTestTarget(threadId, credentialType) {
        return this.testTargetsByThread.get(threadId)?.get(credentialType);
    }
    clearThread(threadId) {
        this.byThread.delete(threadId);
        this.testBypassByThread.delete(threadId);
        this.testTargetsByThread.delete(threadId);
    }
};
exports.EvalThreadCredentialAllowlistService = EvalThreadCredentialAllowlistService;
exports.EvalThreadCredentialAllowlistService = EvalThreadCredentialAllowlistService = __decorate([
    (0, di_1.Service)()
], EvalThreadCredentialAllowlistService);
//# sourceMappingURL=thread-credential-allowlist.service.js.map