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
exports.CredentialImporter = void 0;
const backend_services_1 = require("@n8n/backend-services");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const credentials_service_1 = require("../../../../credentials/credentials.service");
const credential_conflict_policy_1 = require("./credential-conflict-policy");
const credential_matcher_factory_1 = require("./credential-matcher-factory");
const credential_missing_mode_1 = require("./credential-missing-mode");
const requirement_consumers_1 = require("../../spec/requirement-consumers");
let CredentialImporter = class CredentialImporter {
    constructor(credentialMatcherFactory, credentialsService, credentialsFinder) {
        this.credentialMatcherFactory = credentialMatcherFactory;
        this.credentialsService = credentialsService;
        this.credentialsFinder = credentialsFinder;
    }
    async plan(context, request) {
        const resolution = await this.credentialMatcherFactory
            .getMatcher(request.matchingMode)
            .match(request.requirements, {
            projectId: context.projectId,
            user: context.user,
            credentialBindings: request.credentialBindings,
        });
        if (request.conflictPolicy === 'keep-existing') {
            return { ...resolution, candidates: [], updates: [], forbidden: [] };
        }
        return { ...resolution, ...(await this.planUpdates(context.user, request, resolution)) };
    }
    async planUpdates(user, request, resolution) {
        const requirementsById = new Map((request.requirements ?? []).map((requirement) => [requirement.id, requirement]));
        const destinations = new Map();
        const inScope = [];
        for (const [sourceId, targetId] of resolution.successes) {
            const packageCredential = request.packageCredentials?.get(sourceId);
            if (packageCredential === undefined)
                continue;
            if (!destinations.has(targetId)) {
                destinations.set(targetId, await this.credentialsFinder.findById(targetId, { includeSharedProject: true }));
            }
            const destination = destinations.get(targetId);
            if (!destination || !(0, credential_conflict_policy_1.isUpdateCandidate)(destination, request.updateScope))
                continue;
            inScope.push({
                match: {
                    sourceId,
                    targetId,
                    targetName: destination.name,
                    usedBy: (0, requirement_consumers_1.mergeRequirementConsumers)(requirementsById.get(sourceId)?.usedBy ?? []),
                },
                packageCredential,
                destination,
            });
        }
        const updatableIds = inScope.length > 0
            ? await this.credentialsFinder.findCredentialIdsWithScopeForUser([...new Set(inScope.map(({ match }) => match.targetId))], user, ['credential:update'])
            : new Set();
        const candidates = [];
        const updates = [];
        const forbidden = [];
        for (const { match, packageCredential, destination } of inScope) {
            if (!updatableIds.has(match.targetId)) {
                forbidden.push(match);
                continue;
            }
            const candidate = {
                ...match,
                name: packageCredential.name,
                ...(packageCredential.data !== undefined ? { data: packageCredential.data } : {}),
            };
            candidates.push(candidate);
            const differs = (0, credential_conflict_policy_1.credentialDiffers)({ name: destination.name, data: await this.credentialsService.decrypt(destination, true) }, packageCredential);
            if (differs)
                updates.push(candidate);
        }
        return { candidates, updates, forbidden };
    }
    blockingFailures(request, resolution) {
        return (0, credential_missing_mode_1.credentialBlockingFailures)(request.missingMode, resolution);
    }
    async assertCanCreate(context, request, resolution) {
        if (!(0, credential_missing_mode_1.credentialMissingModeUsesPackageData)(request.missingMode))
            return;
        const packageData = packageDataBySourceId(request.requirements);
        for (const { sourceId } of (0, credential_missing_mode_1.credentialsToStub)(request.missingMode, resolution)) {
            const data = packageData.get(sourceId);
            if (data !== undefined) {
                await this.credentialsService.validateStubCredentialData(data, context.user, context.projectId);
            }
        }
    }
    async apply(context, request, resolution) {
        const bindings = new Map(resolution.successes);
        const matched = [...resolution.successes.keys()];
        const stubbed = [];
        const seeded = [];
        const incomplete = [];
        const packageData = (0, credential_missing_mode_1.credentialMissingModeUsesPackageData)(request.missingMode)
            ? packageDataBySourceId(request.requirements)
            : new Map();
        for (const credential of (0, credential_missing_mode_1.credentialsToStub)(request.missingMode, resolution)) {
            const { sourceId, type, name } = credential;
            if (type === undefined) {
                throw new n8n_workflow_1.UnexpectedError(`Cannot create stub for credential "${sourceId}": missing credential type`);
            }
            const data = packageData.get(sourceId);
            const stubCredential = await this.credentialsService.createStubCredential({
                id: request.matchingMode === 'id-only' ? sourceId : undefined,
                name: name ?? sourceId,
                type,
                projectId: context.projectId,
                ...(data !== undefined ? { data } : {}),
            }, context.user);
            bindings.set(sourceId, stubCredential.id);
            if (data === undefined) {
                stubbed.push(sourceId);
            }
            else {
                (request.requirements?.find(({ id }) => id === sourceId)?.packageDataIsComplete
                    ? seeded
                    : incomplete).push(sourceId);
            }
        }
        return { bindings, matched, stubbed, seeded, incomplete };
    }
};
exports.CredentialImporter = CredentialImporter;
exports.CredentialImporter = CredentialImporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [credential_matcher_factory_1.CredentialMatcherFactory, credentials_service_1.CredentialsService, backend_services_1.CredentialsFinderService])
], CredentialImporter);
function packageDataBySourceId(requirements) {
    const data = new Map();
    for (const requirement of requirements ?? []) {
        if (requirement.packageData !== undefined && Object.keys(requirement.packageData).length > 0) {
            data.set(requirement.id, requirement.packageData);
        }
    }
    return data;
}
//# sourceMappingURL=credential-importer.js.map