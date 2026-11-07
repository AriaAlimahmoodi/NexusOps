"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialConnectionStatusProxy = void 0;
const di_1 = require("@n8n/di");
let CredentialConnectionStatusProxy = class CredentialConnectionStatusProxy {
    setProvider(provider) {
        this.provider = provider;
    }
    async findMyConnections(userId, credentialIds) {
        if (!this.provider || credentialIds.length === 0)
            return new Map();
        return await this.provider.findMyConnections(userId, credentialIds);
    }
    async countConnectedUsers(credentialId) {
        if (!this.provider)
            return 0;
        return await this.provider.countConnectedUsers(credentialId);
    }
    async deleteAllUserEntries(credentialId, em) {
        if (!this.provider)
            return;
        await this.provider.deleteAllUserEntries(credentialId, em);
    }
    async cleanupOrphanedEntriesForUsers(userIds, em, credentialId) {
        if (!this.provider || userIds.length === 0)
            return;
        await this.provider.cleanupOrphanedEntriesForUsers(userIds, em, credentialId);
    }
    async cleanupOrphanedEntriesForProjects(credentialId, projectIds, em) {
        if (!this.provider || projectIds.length === 0)
            return;
        await this.provider.cleanupOrphanedEntriesForProjects(credentialId, projectIds, em);
    }
};
exports.CredentialConnectionStatusProxy = CredentialConnectionStatusProxy;
exports.CredentialConnectionStatusProxy = CredentialConnectionStatusProxy = __decorate([
    (0, di_1.Service)()
], CredentialConnectionStatusProxy);
//# sourceMappingURL=credential-connection-status-proxy.js.map