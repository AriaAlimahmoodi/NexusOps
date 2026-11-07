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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialExporter = void 0;
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const backend_services_1 = require("@n8n/backend-services");
const credential_export_policy_1 = require("./credential-export-policy");
const credential_serializer_1 = require("./credential.serializer");
const manifest_entry_1 = require("../../io/manifest-entry");
const requirement_source_1 = require("../requirement-source");
let CredentialExporter = class CredentialExporter {
    constructor(credentialsFinder, credentialSerializer) {
        this.credentialsFinder = credentialsFinder;
        this.credentialSerializer = credentialSerializer;
    }
    async export(request) {
        const entries = [];
        const requirements = [];
        for (const [credentialId, { fallback, usedBy }] of this.groupByCredentialId(request.requirements)) {
            const credential = await this.credentialsFinder.findCredentialForUser(credentialId, request.user, ['credential:read']);
            const { id, name, type } = credential ?? {
                id: credentialId,
                name: fallback.credentialName,
                type: fallback.credentialType,
            };
            if (credential) {
                let decryptedData;
                const data = await (0, credential_export_policy_1.selectCredentialDataForExport)(request.credentialExportPolicy, async () => {
                    decryptedData = await new n8n_core_1.Credentials({ id: credential.id, name: credential.name }, credential.type, credential.data).getData();
                    return decryptedData;
                });
                entries.push(await (0, manifest_entry_1.writeManifestEntry)(request.writer, 'credentials', (0, manifest_entry_1.projectScopedDirectory)('credentials', this.ownerProjectId(credential), request.projectTargetsById), { id: credential.id, name: credential.name }, this.credentialSerializer.serialize(credential, {
                    data,
                    ...(data !== undefined ? { dataIsComplete: (0, isEqual_1.default)(data, decryptedData) } : {}),
                })));
            }
            requirements.push({
                id,
                name,
                type,
                usedBy,
            });
        }
        return { entries, requirements };
    }
    ownerProjectId(credential) {
        return credential.shared?.find((sharing) => sharing.role === 'credential:owner')?.projectId;
    }
    groupByCredentialId(requirements) {
        const grouped = new Map();
        for (const requirement of requirements) {
            const group = grouped.get(requirement.credentialId) ?? {
                fallback: { ...requirement },
                usedBy: [],
            };
            if ('workflowId' in requirement && !('workflowId' in group.fallback)) {
                group.fallback = { ...requirement };
            }
            group.fallback.credentialName ??= requirement.credentialName;
            group.fallback.credentialType ??= requirement.credentialType;
            (0, requirement_source_1.addRequirementUsage)(group, requirement);
            grouped.set(requirement.credentialId, group);
        }
        return grouped;
    }
};
exports.CredentialExporter = CredentialExporter;
exports.CredentialExporter = CredentialExporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.CredentialsFinderService, credential_serializer_1.CredentialSerializer])
], CredentialExporter);
//# sourceMappingURL=credential.exporter.js.map