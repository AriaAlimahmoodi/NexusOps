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
exports.DynamicCredentialUserEntryStorage = void 0;
const di_1 = require("@n8n/di");
const dynamic_credential_user_entry_1 = require("../../database/entities/dynamic-credential-user-entry");
const dynamic_credential_user_entry_repository_1 = require("../../database/repositories/dynamic-credential-user-entry.repository");
let DynamicCredentialUserEntryStorage = class DynamicCredentialUserEntryStorage {
    constructor(dynamicCredentialUserEntryRepository) {
        this.dynamicCredentialUserEntryRepository = dynamicCredentialUserEntryRepository;
    }
    async getCredentialData(credentialId, userId, resolverId, _) {
        const entry = await this.dynamicCredentialUserEntryRepository.findOne({
            where: {
                credentialId,
                userId,
                resolverId,
            },
        });
        return entry?.data ?? null;
    }
    async setCredentialData(credentialId, userId, resolverId, data, _) {
        let entry = await this.dynamicCredentialUserEntryRepository.findOne({
            where: { credentialId, userId, resolverId },
        });
        if (!entry) {
            entry = new dynamic_credential_user_entry_1.DynamicCredentialUserEntry();
            entry.credentialId = credentialId;
            entry.userId = userId;
            entry.resolverId = resolverId;
        }
        entry.data = data;
        await this.dynamicCredentialUserEntryRepository.save(entry);
    }
    async deleteCredentialData(credentialId, userId, resolverId, _) {
        await this.dynamicCredentialUserEntryRepository.delete({
            credentialId,
            userId,
            resolverId,
        });
    }
    async deleteAllCredentialData(handle) {
        await this.dynamicCredentialUserEntryRepository.delete({ resolverId: handle.resolverId });
    }
};
exports.DynamicCredentialUserEntryStorage = DynamicCredentialUserEntryStorage;
exports.DynamicCredentialUserEntryStorage = DynamicCredentialUserEntryStorage = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [dynamic_credential_user_entry_repository_1.DynamicCredentialUserEntryRepository])
], DynamicCredentialUserEntryStorage);
//# sourceMappingURL=dynamic-credential-user-entry-storage.js.map