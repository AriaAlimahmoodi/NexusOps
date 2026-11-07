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
exports.DynamicCredentialEntryStorage = void 0;
const di_1 = require("@n8n/di");
const dynamic_credential_entry_1 = require("../../database/entities/dynamic-credential-entry");
const dynamic_credential_entry_repository_1 = require("../../database/repositories/dynamic-credential-entry.repository");
let DynamicCredentialEntryStorage = class DynamicCredentialEntryStorage {
    constructor(dynamicCredentialEntryRepository) {
        this.dynamicCredentialEntryRepository = dynamicCredentialEntryRepository;
    }
    async getCredentialData(credentialId, subjectId, resolverId, _) {
        const entry = await this.dynamicCredentialEntryRepository.findOne({
            where: {
                credentialId,
                subjectId,
                resolverId,
            },
        });
        return entry?.data ?? null;
    }
    async setCredentialData(credentialId, subjectId, resolverId, data, _) {
        let entry = await this.dynamicCredentialEntryRepository.findOne({
            where: { credentialId, subjectId, resolverId },
        });
        if (!entry) {
            entry = new dynamic_credential_entry_1.DynamicCredentialEntry();
            entry.credentialId = credentialId;
            entry.subjectId = subjectId;
            entry.resolverId = resolverId;
        }
        entry.data = data;
        await this.dynamicCredentialEntryRepository.save(entry);
    }
    async deleteCredentialData(credentialId, subjectId, resolverId, _) {
        await this.dynamicCredentialEntryRepository.delete({
            credentialId,
            subjectId,
            resolverId,
        });
    }
    async deleteAllCredentialData(handle) {
        await this.dynamicCredentialEntryRepository.delete({ resolverId: handle.resolverId });
    }
};
exports.DynamicCredentialEntryStorage = DynamicCredentialEntryStorage;
exports.DynamicCredentialEntryStorage = DynamicCredentialEntryStorage = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [dynamic_credential_entry_repository_1.DynamicCredentialEntryRepository])
], DynamicCredentialEntryStorage);
//# sourceMappingURL=dynamic-credential-entry-storage.js.map