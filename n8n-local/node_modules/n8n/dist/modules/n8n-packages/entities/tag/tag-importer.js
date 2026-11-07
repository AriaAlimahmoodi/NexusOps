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
exports.TagImporter = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const tag_service_1 = require("../../../../services/tag.service");
const tag_import_decision_1 = require("./tag-import-decision");
let TagImporter = class TagImporter {
    constructor(tagService, globalConfig) {
        this.tagService = tagService;
        this.globalConfig = globalConfig;
    }
    async plan(context, request, appliedWorkflows) {
        const plan = {
            matched: [],
            creations: [],
            renames: [],
            reconciles: [],
            dropped: [],
            failures: [],
        };
        if (this.globalConfig.tags.disabled)
            return plan;
        const referencedTagIds = [...new Set(appliedWorkflows.flatMap(({ tagIds }) => tagIds ?? []))];
        if (referencedTagIds.length === 0)
            return plan;
        const requirementsById = new Map((request.requirements ?? []).map((requirement) => [requirement.id, requirement]));
        const referencedRequirements = referencedTagIds.map((id) => {
            const requirement = requirementsById.get(id);
            if (!requirement) {
                throw new n8n_workflow_1.UserError(`Package workflows reference tag "${id}", which is missing from the package's tag requirements.`);
            }
            return requirement;
        });
        const targetsById = new Map((await this.tagService.getByIds(referencedTagIds)).map((tag) => [tag.id, toTagRef(tag)]));
        const wantedNames = [...new Set(referencedRequirements.map(({ name }) => name.trim()))];
        const holdersByName = new Map((await this.tagService.getByNames(wantedNames)).map((tag) => [tag.name, toTagRef(tag)]));
        const decisionFailures = [];
        for (const requirement of referencedRequirements) {
            const holder = holdersByName.get(requirement.name.trim());
            const effect = (0, tag_import_decision_1.decideTagImportAction)(requirement, targetsById.get(requirement.id), holder && holder.id !== requirement.id ? holder : undefined, request.missingMode, request.conflictPolicy);
            if (effect.action === 'attach')
                plan.matched.push(effect.target);
            else if (effect.action === 'create')
                plan.creations.push(effect.tag);
            else if (effect.action === 'rename')
                plan.renames.push(effect.rename);
            else if (effect.action === 'reconcile')
                plan.reconciles.push(effect.reconcile);
            else if (effect.action === 'drop')
                plan.dropped.push(effect.tag);
            else
                decisionFailures.push(effect.failure);
        }
        decisionFailures.push(...duplicateWrittenNameFailures(plan));
        plan.failures = decisionFailures;
        if (plan.creations.length > 0 && !(0, permissions_1.hasGlobalScope)(context.user, 'tag:create')) {
            plan.failures.push({ kind: 'permission-denied', missingScope: 'tag:create' });
        }
        if ((plan.renames.length > 0 || plan.reconciles.length > 0) &&
            !(0, permissions_1.hasGlobalScope)(context.user, 'tag:update')) {
            plan.failures.push({ kind: 'permission-denied', missingScope: 'tag:update' });
        }
        return plan;
    }
    async apply(context, plan) {
        if (plan.creations.length === 0 && plan.renames.length === 0 && plan.reconciles.length === 0) {
            return;
        }
        if (plan.creations.length > 0 && !(0, permissions_1.hasGlobalScope)(context.user, 'tag:create')) {
            throw new errors_1.ForbiddenError('User is missing a scope required to create a tag');
        }
        if ((plan.renames.length > 0 || plan.reconciles.length > 0) &&
            !(0, permissions_1.hasGlobalScope)(context.user, 'tag:update')) {
            throw new errors_1.ForbiddenError('User is missing a scope required to rename or reconcile a tag');
        }
        const existingById = new Map((await this.tagService.getByIds([
            ...plan.creations.map(({ id }) => id),
            ...plan.renames.map(({ id }) => id),
            ...plan.reconciles.flatMap(({ id, oldId }) => [id, oldId]),
        ])).map((tag) => [tag.id, tag]));
        for (const creation of plan.creations) {
            if (existingById.has(creation.id))
                continue;
            await this.tagService.save(this.tagService.toEntity(creation), 'create');
        }
        for (const rename of plan.renames) {
            const current = existingById.get(rename.id);
            if (!current || current.name === rename.to)
                continue;
            await this.tagService.save(this.tagService.toEntity({ id: rename.id, name: rename.to }), 'update');
        }
        for (const reconcile of plan.reconciles) {
            if (existingById.has(reconcile.id))
                continue;
            if (!existingById.has(reconcile.oldId))
                continue;
            await this.tagService.reconcileTagId(reconcile.oldId, reconcile.id);
        }
    }
};
exports.TagImporter = TagImporter;
exports.TagImporter = TagImporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [tag_service_1.TagService, config_1.GlobalConfig])
], TagImporter);
function toTagRef(tag) {
    return { id: tag.id, name: tag.name };
}
function duplicateWrittenNameFailures(plan) {
    const nameCounts = new Map();
    const writtenNames = [
        ...plan.creations.map(({ name }) => name),
        ...plan.renames.map(({ to }) => to),
    ];
    for (const name of writtenNames)
        nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
    const duplicated = (name) => (nameCounts.get(name) ?? 0) > 1;
    return [
        ...plan.creations
            .filter(({ name }) => duplicated(name))
            .map(({ id, name }) => ({ kind: 'name-collision', sourceId: id, name })),
        ...plan.renames
            .filter(({ to }) => duplicated(to))
            .map(({ id, to }) => ({ kind: 'name-collision', sourceId: id, name: to })),
    ];
}
//# sourceMappingURL=tag-importer.js.map