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
exports.TypeAvailabilityPolicyService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const load_nodes_and_credentials_1 = require("../../load-nodes-and-credentials");
const node_types_1 = require("../../node-types");
const type_availability_policy_attachment_repository_1 = require("./database/repositories/type-availability-policy-attachment.repository");
const type_availability_policy_scope_repository_1 = require("./database/repositories/type-availability-policy-scope.repository");
const type_availability_policy_repository_1 = require("./database/repositories/type-availability-policy.repository");
const constants_1 = require("./constants");
const effective_policy_1 = require("./effective-policy");
const package_resolver_1 = require("./package-resolver");
const policy_evaluator_1 = require("./policy-evaluator");
const policy_rule_lint_1 = require("./policy-rule-lint");
const type_availability_policy_snapshot_1 = require("./type-availability-policy-snapshot");
function rulesContainDelegate(rules) {
    return rules.some((rule) => rule.action === 'delegate');
}
const DELEGATE_RULE_AT_PROJECT_SCOPE = 'A rule cannot use action "delegate" at project scope';
function assertNoDelegateAtProjectScope(projectId, defaultAction, rules = []) {
    if (projectId === null)
        return;
    if (defaultAction === 'delegate') {
        throw new n8n_workflow_1.UserError('defaultAction cannot be "delegate" at project scope');
    }
    if (rulesContainDelegate(rules)) {
        throw new n8n_workflow_1.UserError(DELEGATE_RULE_AT_PROJECT_SCOPE);
    }
}
function assertNoCredentialOnlyNodeRules(kind, rules) {
    if (kind !== constants_1.NODE_TYPES_KIND)
        return;
    for (const rule of rules) {
        if (rule.selector.kind === 'name' && (0, n8n_workflow_1.isCredentialOnlyNodeType)(rule.selector.value)) {
            const credentialType = (0, n8n_workflow_1.getCredentialOnlyNodeCredentialType)(rule.selector.value);
            throw new n8n_workflow_1.UserError(`Node type rule names the credential-only node "${rule.selector.value}", which is HTTP Request with a credential attached. Write a credential type rule on "${credentialType}" instead.`);
        }
    }
}
function assertNoCredentialOnlyPackageRules(rules) {
    for (const rule of rules) {
        if (rule.selector.kind === 'package' && rule.selector.value === n8n_workflow_1.CREDENTIAL_ONLY_NODE_PREFIX) {
            throw new n8n_workflow_1.UserError(`Package rule names "${n8n_workflow_1.CREDENTIAL_ONLY_NODE_PREFIX}", which no package provides. Write a credential type rule instead.`);
        }
    }
}
function assertExtendsSelectorsValid(kind, rules) {
    if (kind === constants_1.CREDENTIAL_TYPES_KIND)
        return;
    if (rules.some((rule) => rule.selector.kind === 'extends')) {
        throw new n8n_workflow_1.UserError('An "extends" rule is only valid in a credential type policy');
    }
}
function assertNoDuplicateAttachmentSlots(attachments) {
    const seenPolicyIds = new Set();
    const seenSlots = new Set();
    for (const attachment of attachments) {
        if (seenPolicyIds.has(attachment.policyId)) {
            throw new n8n_workflow_1.UserError(`Duplicate policyId in attachment list: ${attachment.policyId}`);
        }
        seenPolicyIds.add(attachment.policyId);
        const slot = `${attachment.isFloor}:${attachment.priority}`;
        if (seenSlots.has(slot)) {
            throw new n8n_workflow_1.UserError(`Duplicate (isFloor, priority) pair in attachment list: isFloor=${attachment.isFloor}, priority=${attachment.priority}`);
        }
        seenSlots.add(slot);
    }
}
let TypeAvailabilityPolicyService = class TypeAvailabilityPolicyService {
    constructor(policyRepository, scopeRepository, attachmentRepository, transactionRunner, eventService, snapshot, loadNodesAndCredentials, nodeTypes) {
        this.policyRepository = policyRepository;
        this.scopeRepository = scopeRepository;
        this.attachmentRepository = attachmentRepository;
        this.transactionRunner = transactionRunner;
        this.eventService = eventService;
        this.snapshot = snapshot;
        this.loadNodesAndCredentials = loadNodesAndCredentials;
        this.nodeTypes = nodeTypes;
    }
    async getEffectivePolicy(kind, projectId, ctx = {}) {
        const scope = await this.scopeRepository.findScopeByKindAndProject(kind, projectId, ctx);
        if (!scope)
            return (0, effective_policy_1.unconfiguredScope)(kind, projectId);
        const attachments = await this.attachmentRepository.listAttachmentsForScope(scope.id, ctx);
        return (0, effective_policy_1.toEffectivePolicy)(scope, attachments);
    }
    async setDefaultAction(kind, projectId, defaultAction, expectedVersion, updatedBy) {
        assertNoDelegateAtProjectScope(projectId, defaultAction);
        const result = await this.transactionRunner.run({}, async (ctx) => {
            const scope = await this.scopeRepository.findScopeByKindAndProject(kind, projectId, ctx, true);
            const currentVersion = scope?.version ?? effective_policy_1.UNCONFIGURED_VERSION;
            if (currentVersion !== expectedVersion) {
                throw new errors_1.ConflictError(`Policy scope has changed since it was last read (expected version ${expectedVersion}, found ${currentVersion})`);
            }
            if (!scope) {
                const created = await this.createScopeOrConflict({ kind, projectId, defaultAction, updatedBy }, ctx);
                return { before: null, after: created };
            }
            const before = { defaultAction: scope.defaultAction, version: scope.version };
            const after = (await this.scopeRepository.updateDefaultAction(scope.id, defaultAction, updatedBy, ctx)) ??
                scope;
            return { before, after };
        });
        if (result.before === null || result.before.version !== result.after.version) {
            await this.snapshot.refreshAfterWrite();
        }
        this.eventService.emit('node-type-policy-scope-updated', {
            updatedBy,
            kind,
            projectId,
            scopeId: result.after.id,
            before: result.before,
            after: { defaultAction: result.after.defaultAction, version: result.after.version },
        });
        return result.after;
    }
    async createScopeOrConflict(input, ctx) {
        const { scope, created } = await this.scopeRepository.createScopeIfAbsent(input, ctx);
        if (!created) {
            throw new errors_1.ConflictError(`Policy scope was created concurrently (expected version ${effective_policy_1.UNCONFIGURED_VERSION}, found ${scope.version})`);
        }
        return scope;
    }
    validateAndLintRules(kind, rules) {
        assertNoCredentialOnlyPackageRules(rules);
        assertNoCredentialOnlyNodeRules(kind, rules);
        assertExtendsSelectorsValid(kind, rules);
        return (0, policy_rule_lint_1.lintPolicyRules)(rules, {
            resolvePackage: (0, package_resolver_1.packageResolverFor)(kind, this.loadNodesAndCredentials),
            policedType: (0, package_resolver_1.policedTypeFor)(kind, this.nodeTypes, this.loadNodesAndCredentials),
            isLoaded: (0, package_resolver_1.loadedCheckFor)(kind, this.nodeTypes, this.loadNodesAndCredentials),
        });
    }
    async createPolicyDocument(kind, rules, updatedBy) {
        const warnings = this.validateAndLintRules(kind, rules);
        const policy = await this.policyRepository.createPolicy({ kind, rules, updatedBy }, {});
        this.eventService.emit('node-type-policy-document-created', {
            updatedBy,
            kind,
            policyId: policy.id,
            origin: 'document-api',
            after: { rules: policy.rules, version: policy.version },
        });
        return { policy, warnings };
    }
    async updatePolicyDocument(kind, policyId, rules, expectedVersion, updatedBy) {
        const warnings = this.validateAndLintRules(kind, rules);
        const result = await this.transactionRunner.run({}, async (ctx) => {
            let scopesChanged = false;
            const attachedScopeIds = await this.attachmentRepository.listScopeIdsAttachedToPolicy(policyId, ctx);
            const lockedScopeIds = await this.scopeRepository.lockScopesByIds(attachedScopeIds, ctx);
            if (rulesContainDelegate(rules) &&
                (await this.scopeRepository.containsProjectScope(lockedScopeIds, ctx))) {
                throw new n8n_workflow_1.UserError(DELEGATE_RULE_AT_PROJECT_SCOPE);
            }
            const existing = await this.policyRepository.findByIdAndKind(policyId, kind, ctx, true);
            if (!existing) {
                throw new errors_1.NotFoundError(`Policy document not found: ${policyId}`);
            }
            if (existing.version !== expectedVersion) {
                throw new errors_1.ConflictError(`Policy document has changed since it was last read (expected version ${expectedVersion}, found ${existing.version})`);
            }
            const updated = await this.policyRepository.updateRules(policyId, rules, updatedBy, ctx);
            if (!updated) {
                throw new errors_1.NotFoundError(`Policy document not found: ${policyId}`);
            }
            if (updated.version !== existing.version) {
                const locked = new Set(lockedScopeIds);
                const scopeIdsNow = await this.attachmentRepository.listScopeIdsAttachedToPolicy(policyId, ctx);
                if (scopeIdsNow.some((id) => !locked.has(id))) {
                    throw new errors_1.ConflictError('Policy document was attached to another scope while it was being updated');
                }
                await this.scopeRepository.bumpVersions(lockedScopeIds, ctx);
                scopesChanged = lockedScopeIds.length > 0;
            }
            return { existing, updated, scopesChanged };
        });
        if (result.scopesChanged)
            await this.snapshot.refreshAfterWrite();
        this.eventService.emit('node-type-policy-document-updated', {
            updatedBy,
            kind: result.existing.kind,
            policyId,
            origin: 'document-api',
            before: { rules: result.existing.rules, version: result.existing.version },
            after: { rules: result.updated.rules, version: result.updated.version },
        });
        return { policy: result.updated, warnings };
    }
    async deletePolicyDocument(kind, policyId, updatedBy) {
        const existing = await this.transactionRunner.run({}, async (ctx) => {
            const policy = await this.policyRepository.findByIdAndKind(policyId, kind, ctx, true);
            if (!policy) {
                throw new errors_1.NotFoundError(`Policy document not found: ${policyId}`);
            }
            const attachedScopeIds = await this.attachmentRepository.listScopeIdsAttachedToPolicy(policyId, ctx);
            if (attachedScopeIds.length > 0) {
                throw new errors_1.ConflictError(`Cannot delete policy document: still attached to ${attachedScopeIds.length} scope(s)`);
            }
            await this.policyRepository.deletePolicy(policyId, ctx);
            return policy;
        });
        this.eventService.emit('node-type-policy-document-deleted', {
            updatedBy,
            kind: existing.kind,
            policyId,
            before: { rules: existing.rules, version: existing.version },
        });
    }
    async getPolicyDocument(kind, policyId) {
        return await this.policyRepository.findByIdAndKind(policyId, kind, {});
    }
    async listPolicyDocuments(kind) {
        return await this.policyRepository.findByKind(kind, {});
    }
    async listPolicyDocumentsPage(kind, offset, limit) {
        return await this.policyRepository.findPageByKind(kind, offset, limit, {});
    }
    async getAttachments(kind, scopeId, ctx = {}) {
        const scope = await this.scopeRepository.findScopeByIdAndKind(scopeId, kind, ctx);
        if (!scope) {
            throw new errors_1.NotFoundError(`Policy scope not found: ${scopeId}`);
        }
        const attachments = await this.attachmentRepository.listAttachmentsForScope(scopeId, ctx);
        return { attachments: (0, policy_evaluator_1.orderedAttachments)(attachments), version: scope.version };
    }
    async replaceAttachments(kind, scopeId, attachments, expectedVersion, updatedBy) {
        assertNoDuplicateAttachmentSlots(attachments);
        const result = await this.transactionRunner.run({}, async (ctx) => {
            const scope = await this.scopeRepository.findScopeByIdAndKind(scopeId, kind, ctx, true);
            if (!scope) {
                throw new errors_1.NotFoundError(`Policy scope not found: ${scopeId}`);
            }
            if (scope.version !== expectedVersion) {
                throw new errors_1.ConflictError(`Policy scope has changed since it was last read (expected version ${expectedVersion}, found ${scope.version})`);
            }
            if (scope.projectId !== null && attachments.length > 0) {
                const policies = await this.policyRepository.findManyByIds(attachments.map((a) => a.policyId), ctx, true);
                if (policies.some((policy) => rulesContainDelegate(policy.rules))) {
                    throw new n8n_workflow_1.UserError(DELEGATE_RULE_AT_PROJECT_SCOPE);
                }
            }
            const before = await this.attachmentRepository.listAttachmentsForScope(scopeId, ctx);
            await this.attachmentRepository.replaceAttachmentsForScope(scopeId, attachments.map((a) => ({
                policyId: a.policyId,
                priority: a.priority,
                isFloor: a.isFloor,
            })), ctx);
            await this.scopeRepository.bumpVersion(scopeId, ctx);
            const after = await this.attachmentRepository.listAttachmentsForScope(scopeId, ctx);
            const scopeAfter = await this.scopeRepository.findScopeById(scopeId, ctx);
            return {
                kind: scope.kind,
                projectId: scope.projectId,
                before,
                after,
                versionBefore: scope.version,
                versionAfter: scopeAfter?.version ?? scope.version + 1,
            };
        });
        await this.snapshot.refreshAfterWrite();
        this.eventService.emit('node-type-policy-attachments-updated', {
            updatedBy,
            kind: result.kind,
            projectId: result.projectId,
            scopeId,
            before: { attachments: result.before, version: result.versionBefore },
            after: { attachments: result.after, version: result.versionAfter },
        });
        return { attachments: (0, policy_evaluator_1.orderedAttachments)(result.after), version: result.versionAfter };
    }
    async setEffectivePolicy(kind, projectId, input, expectedVersion, updatedBy) {
        assertNoDelegateAtProjectScope(projectId, input.defaultAction, input.rules);
        const warnings = this.validateAndLintRules(kind, input.rules);
        const result = await this.transactionRunner.run({}, async (ctx) => {
            const scope = await this.scopeRepository.findScopeByKindAndProject(kind, projectId, ctx, true);
            const currentVersion = scope?.version ?? effective_policy_1.UNCONFIGURED_VERSION;
            if (currentVersion !== expectedVersion) {
                throw new errors_1.ConflictError(`Policy scope has changed since it was last read (expected version ${expectedVersion}, found ${currentVersion})`);
            }
            const scopeBefore = scope
                ? { defaultAction: scope.defaultAction, version: scope.version }
                : null;
            const existingAttachments = scope
                ? await this.attachmentRepository.listAttachmentsForScope(scope.id, ctx)
                : [];
            if (existingAttachments.length > 1) {
                throw new errors_1.ConflictError(`Cannot replace the policy of a scope with ${existingAttachments.length} attached documents; manage its attachments instead`);
            }
            const existingDocumentId = existingAttachments[0]?.policyId ?? null;
            const existingDocument = existingDocumentId
                ? await this.policyRepository.findByIdAndKind(existingDocumentId, kind, ctx, true)
                : null;
            if (existingDocumentId && !existingDocument) {
                throw new errors_1.NotFoundError(`Policy document not found: ${existingDocumentId}`);
            }
            if (scope && existingDocumentId) {
                const attachedScopeIds = await this.attachmentRepository.listScopeIdsAttachedToPolicy(existingDocumentId, ctx);
                if (attachedScopeIds.some((id) => id !== scope.id)) {
                    throw new errors_1.ConflictError('Cannot replace a policy document that is attached to other scopes; manage its attachments instead');
                }
            }
            const scopeCreated = scope === null;
            const defaultActionChanged = scope !== null && scope.defaultAction !== input.defaultAction;
            const scopeId = scope
                ? scope.id
                : (await this.createScopeOrConflict({ kind, projectId, defaultAction: input.defaultAction, updatedBy }, ctx)).id;
            if (defaultActionChanged) {
                await this.scopeRepository.updateDefaultAction(scopeId, input.defaultAction, updatedBy, ctx);
            }
            let documentBefore = null;
            let documentAfter;
            let documentCreated;
            let policyId;
            if (existingDocument) {
                documentBefore = { rules: existingDocument.rules, version: existingDocument.version };
                const updated = await this.policyRepository.updateRules(existingDocument.id, input.rules, updatedBy, ctx);
                if (!updated) {
                    throw new errors_1.NotFoundError(`Policy document not found: ${existingDocument.id}`);
                }
                documentAfter = { rules: updated.rules, version: updated.version };
                documentCreated = false;
                policyId = existingDocument.id;
            }
            else {
                const created = await this.policyRepository.createPolicy({ kind, rules: input.rules, updatedBy }, ctx);
                documentAfter = { rules: created.rules, version: created.version };
                documentCreated = true;
                policyId = created.id;
                await this.attachmentRepository.replaceAttachmentsForScope(scopeId, [{ policyId, priority: 0, isFloor: false }], ctx);
            }
            if (!scopeCreated && !defaultActionChanged) {
                await this.scopeRepository.bumpVersion(scopeId, ctx);
            }
            const scopeAfterRow = await this.scopeRepository.findScopeById(scopeId, ctx);
            const scopeAfter = {
                defaultAction: scopeAfterRow?.defaultAction ?? input.defaultAction,
                version: scopeAfterRow?.version ?? currentVersion + 1,
            };
            return {
                scopeId,
                scopeBefore,
                scopeAfter,
                documentBefore,
                documentAfter,
                documentCreated,
                policyId,
            };
        });
        await this.snapshot.refreshAfterWrite();
        this.eventService.emit('node-type-policy-scope-updated', {
            updatedBy,
            kind,
            projectId,
            scopeId: result.scopeId,
            before: result.scopeBefore,
            after: result.scopeAfter,
        });
        if (result.documentCreated) {
            this.eventService.emit('node-type-policy-document-created', {
                updatedBy,
                kind,
                policyId: result.policyId,
                origin: 'composed-save',
                after: result.documentAfter,
            });
        }
        else {
            this.eventService.emit('node-type-policy-document-updated', {
                updatedBy,
                kind,
                policyId: result.policyId,
                origin: 'composed-save',
                before: result.documentBefore ?? { rules: [], version: effective_policy_1.UNCONFIGURED_VERSION },
                after: result.documentAfter,
            });
        }
        this.eventService.emit('node-type-policy-saved', {
            updatedBy,
            kind,
            projectId,
            scopeId: result.scopeId,
            before: result.scopeBefore,
            after: result.scopeAfter,
            rulesBefore: result.documentBefore?.rules ?? null,
            rulesAfter: result.documentAfter.rules,
            shadowWarningCount: warnings.filter((warning) => warning.kind === 'shadowed').length,
            notLoadedWarningCount: warnings.filter((warning) => warning.kind === 'notLoaded').length,
        });
        return {
            scopeId: result.scopeId,
            defaultAction: result.scopeAfter.defaultAction,
            version: result.scopeAfter.version,
            rules: [...result.documentAfter.rules],
            warnings,
        };
    }
    async evaluateComposedType(kind, projectId, typeName) {
        const { instance, project } = await this.readComposedScopes(kind, projectId);
        return (0, policy_evaluator_1.evaluateComposedType)(instance, project, (0, package_resolver_1.policedTypeFor)(kind, this.nodeTypes, this.loadNodesAndCredentials)(typeName), (0, package_resolver_1.packageResolverFor)(kind, this.loadNodesAndCredentials));
    }
    async evaluateComposedTypes(kind, projectId, typeNames) {
        const { verdicts } = await this.evaluateComposedTypesFor(kind, projectId, typeNames);
        return verdicts;
    }
    async evaluateComposedTypesFor(kind, projectId, typeNames) {
        const { instance, project } = await this.readComposedScopes(kind, projectId);
        return {
            verdicts: this.verdictComposer(kind, typeNames)(instance, project),
            versions: [
                { scope: 'instance', version: instance.version },
                ...(projectId === null ? [] : [{ scope: 'project', version: project.version }]),
            ],
        };
    }
    async evaluateComposedTypesForAllProjects(kind, typeNames) {
        const [instance, projects] = await Promise.all([
            this.readEnforcedScope(kind, null),
            this.snapshot.projectScopes(kind) ?? this.readProjectScopes(kind),
        ]);
        const composeVerdicts = this.verdictComposer(kind, typeNames);
        return {
            withoutProjectPolicy: composeVerdicts(instance, (0, effective_policy_1.unconfiguredScope)(kind, null)),
            byProject: projects.map((project) => ({
                projectId: project.projectId,
                verdicts: composeVerdicts(instance, project),
            })),
        };
    }
    verdictComposer(kind, typeNames) {
        const resolvePackage = (0, package_resolver_1.packageResolverFor)(kind, this.loadNodesAndCredentials);
        const types = typeNames.map((0, package_resolver_1.policedTypeFor)(kind, this.nodeTypes, this.loadNodesAndCredentials));
        return (instance, project) => types.map((type) => ({
            name: type.name,
            ...(0, policy_evaluator_1.evaluateComposedType)(instance, project, type, resolvePackage),
        }));
    }
    async readComposedScopes(kind, projectId) {
        const [instance, project] = await Promise.all([
            this.readEnforcedScope(kind, null),
            projectId === null ? (0, effective_policy_1.unconfiguredScope)(kind, null) : this.readEnforcedScope(kind, projectId),
        ]);
        return { instance, project };
    }
    async readEnforcedScope(kind, projectId) {
        return this.snapshot.read(kind, projectId) ?? (await this.getEffectivePolicy(kind, projectId));
    }
    async readProjectScopes(kind) {
        const scopes = await this.scopeRepository.findProjectScopes(kind, {});
        const attachmentsByScope = await this.attachmentRepository.listAttachmentsForScopes(scopes.map((scope) => scope.id), {});
        return scopes.map((scope) => ({
            ...(0, effective_policy_1.toEffectivePolicy)(scope, attachmentsByScope.get(scope.id) ?? []),
            projectId: scope.projectId,
        }));
    }
};
exports.TypeAvailabilityPolicyService = TypeAvailabilityPolicyService;
exports.TypeAvailabilityPolicyService = TypeAvailabilityPolicyService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [type_availability_policy_repository_1.TypeAvailabilityPolicyRepository, type_availability_policy_scope_repository_1.TypeAvailabilityPolicyScopeRepository, type_availability_policy_attachment_repository_1.TypeAvailabilityPolicyAttachmentRepository, db_1.TransactionRunner, backend_services_1.EventService, type_availability_policy_snapshot_1.TypeAvailabilityPolicySnapshot, load_nodes_and_credentials_1.LoadNodesAndCredentials, node_types_1.NodeTypes])
], TypeAvailabilityPolicyService);
//# sourceMappingURL=type-availability-policy.service.js.map