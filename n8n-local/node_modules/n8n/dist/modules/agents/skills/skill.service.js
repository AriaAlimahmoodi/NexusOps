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
exports.SkillService = void 0;
exports.toSkillContent = toSkillContent;
exports.toAgentSkill = toAgentSkill;
exports.withTrimmedName = withTrimmedName;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const permissions_1 = require("@n8n/permissions");
const generate_nano_id_1 = require("@n8n/utils/generate-nano-id");
const check_access_1 = require("../../../permissions.ee/check-access");
const agent_update_broadcaster_1 = require("../agent-update-broadcaster");
const agent_repository_1 = require("../repositories/agent.repository");
const skill_repository_1 = require("../repositories/skill.repository");
const agent_config_hash_1 = require("../utils/agent-config-hash");
const skill_content_hash_1 = require("./skill-content-hash");
const skill_name_taken_error_1 = require("./skill-name-taken.error");
const skill_names_1 = require("./skill-names");
function toSkillContent(skill, frontmatter = null) {
    const content = {
        name: skill.name,
        description: skill.description,
        instructions: skill.instructions,
        frontmatter: frontmatter && Object.keys(frontmatter).length > 0 ? { ...frontmatter } : null,
        files: (skill.references ?? []).map(({ path, content: text }) => ({ path, content: text })),
    };
    return content;
}
function toAgentSkill(row) {
    return {
        name: row.version.name,
        description: row.version.description,
        instructions: row.version.instructions,
        ...(row.files.length
            ? { references: row.files.map(({ path, content }) => ({ path, content })) }
            : {}),
    };
}
function assertHasInstructions(skill) {
    if (!skill.instructions.trim())
        throw new errors_1.UserError('Skill instructions are required.');
}
function trimmedName(name) {
    const trimmed = name.trim();
    if (!trimmed)
        throw new errors_1.UserError('Skill name is required.');
    return trimmed;
}
function withTrimmedName(skill) {
    return { ...skill, name: trimmedName(skill.name) };
}
function toRecord(rows) {
    return Object.fromEntries([...rows].map(([refId, row]) => [refId, toAgentSkill(row)]));
}
let SkillService = class SkillService {
    constructor(logger, skillRepository, agentRepository, txRunner, agentUpdateBroadcaster, projectScopeService) {
        this.logger = logger;
        this.skillRepository = skillRepository;
        this.agentRepository = agentRepository;
        this.txRunner = txRunner;
        this.agentUpdateBroadcaster = agentUpdateBroadcaster;
        this.projectScopeService = projectScopeService;
    }
    async resolveForAgentDraft(refs, ctx = {}) {
        return toRecord(await this.resolveRows(refs, ctx));
    }
    async resolvePinned(agentVersionId, ctx = {}) {
        return toRecord(await this.skillRepository.findPinned(agentVersionId, ctx));
    }
    async resolveRows(refs, ctx) {
        const latest = await this.skillRepository.findLatestSaved(refs.map((ref) => ref.id), ctx);
        const pinnedIds = refs.flatMap((ref) => (ref.versionId ? [ref.versionId] : []));
        const pinned = await this.skillRepository.findVersionsByIds(pinnedIds, ctx);
        const rows = new Map();
        for (const ref of refs) {
            const pin = ref.versionId ? pinned.get(ref.versionId) : undefined;
            const row = pin?.skill.id === ref.id ? pin : latest.get(ref.id);
            if (row)
                rows.set(ref.id, row);
        }
        return rows;
    }
    async latestNames(skillIds, ctx) {
        const rows = await this.skillRepository.findLatestSaved(skillIds, ctx);
        return new Map([...rows].map(([id, row]) => [id, row.version.name]));
    }
    async runtimeNames(refs, ctx) {
        const latest = await this.latestNames(refs.map((ref) => ref.id), ctx);
        const pinned = await this.skillRepository.findVersionsByIds(refs.flatMap((ref) => (ref.versionId ? [ref.versionId] : [])), ctx);
        return (ref) => {
            const pin = ref.versionId ? pinned.get(ref.versionId) : undefined;
            return pin?.skill.id === ref.id ? pin.version.name : latest.get(ref.id);
        };
    }
    async create(input, ctx = {}) {
        const skill = withTrimmedName(input.skill);
        assertHasInstructions(skill);
        if (input.checkNameTaken) {
            await this.assertNameFree(skill.name, input.target, undefined, ctx);
        }
        const id = `skill_${(0, generate_nano_id_1.generateNanoId)()}`;
        await this.skillRepository.createSkill({ id, target: input.target, source: input.source, createdById: input.createdById }, toSkillContent(skill), ctx);
        this.logger.debug('Created skill', { skillId: id });
        return id;
    }
    async save(skillId, update, userId, ctx = {}, pushRef) {
        const { saved, following } = await this.txRunner.run(ctx, async (txCtx) => {
            await this.skillRepository.lockForEdit([skillId], txCtx);
            const latest = (await this.skillRepository.findLatestSaved([skillId], txCtx)).get(skillId);
            if (!latest)
                throw new errors_1.NotFoundError('Skill not found');
            const current = toAgentSkill(latest);
            const { baseSkillHash, allowedTools: _ignored, ...changes } = update;
            if (changes.name !== undefined)
                changes.name = trimmedName(changes.name);
            if (baseSkillHash !== (0, agent_config_hash_1.getAgentSkillHash)(current)) {
                throw new errors_1.ConflictError('The skill was changed somewhere else. Reload to get the latest version.');
            }
            const skill = { ...current, ...changes };
            if (!skill.references?.length)
                delete skill.references;
            assertHasInstructions(skill);
            const content = toSkillContent(skill, latest.version.frontmatter);
            if ((0, skill_content_hash_1.skillContentHash)(content) === latest.version.contentHash) {
                const unchanged = { versionId: latest.version.id, version: latest.version.version };
                const result = { ...unchanged, created: false, skill: current, followingAgentIds: [] };
                return { saved: result, following: [] };
            }
            if ((0, api_types_1.skillNameKey)(skill.name) !== (0, api_types_1.skillNameKey)(latest.version.name)) {
                await this.assertNameFree(skill.name, latest.skill, skillId, txCtx);
                await this.assertRenameKeepsNamesApart(skillId, latest.version.name, skill.name, txCtx);
            }
            const version = await this.skillRepository.nextVersionNumber(skillId, txCtx);
            const versionId = await this.skillRepository.insertSavedVersion(skillId, version, content, userId, txCtx);
            const followingIds = await this.skillRepository.findFollowingAgentIds([skillId], txCtx);
            await this.agentRepository.markDraftChangedIfInSync(followingIds, txCtx);
            const result = { versionId, version, created: true, skill, followingAgentIds: followingIds };
            return { saved: result, following: followingIds };
        });
        if (!ctx.trx)
            await this.refreshFollowingAgents(following, pushRef);
        this.logger.debug('Saved skill', {
            skillId,
            version: saved.version,
            created: saved.created,
            following,
        });
        return saved;
    }
    async refreshFollowingAgents(agentIds, excludePushRef) {
        if (agentIds.length === 0)
            return;
        const { AgentRuntimeCacheService } = await import('../agent-runtime-cache.service.js');
        const cache = di_1.Container.get(AgentRuntimeCacheService);
        for (const agentId of agentIds)
            cache.clearRuntimes(agentId);
        for (const agent of await this.agentRepository.findProjectIdsByIds(agentIds)) {
            this.agentUpdateBroadcaster.notify({ projectId: agent.projectId, agentId: agent.id, source: 'user' }, excludePushRef);
        }
    }
    async freeName(requested, target, ctx = {}) {
        const taken = new Set((await this.skillRepository.findLatestNamesInTarget({ projectId: target.projectId, agentId: target.agentId }, ctx)).map(({ name }) => (0, api_types_1.skillNameKey)(name)));
        const base = requested.trim();
        if (!taken.has((0, api_types_1.skillNameKey)(base)))
            return base;
        for (let n = 2;; n++) {
            const suffix = ` ${n}`;
            const candidate = `${base.slice(0, api_types_1.AGENT_SKILL_NAME_MAX_LENGTH - suffix.length)}${suffix}`;
            if (!taken.has((0, api_types_1.skillNameKey)(candidate)))
                return candidate;
        }
    }
    async assertNameFree(name, target, exceptSkillId, ctx) {
        const key = (0, api_types_1.skillNameKey)(name);
        const names = await this.skillRepository.findLatestNamesInTarget({ projectId: target.projectId, agentId: target.agentId }, ctx);
        if (names.some((other) => other.skillId !== exceptSkillId && (0, api_types_1.skillNameKey)(other.name) === key)) {
            throw new skill_name_taken_error_1.SkillNameTakenError(name);
        }
    }
    async assertRenameKeepsNamesApart(skillId, oldName, newName, ctx) {
        const agents = await this.skillRepository.findFollowingAgents(skillId, ctx);
        const refs = await this.skillRepository.findDependencies(agents.map((agent) => agent.id), ctx);
        const otherRefs = (agent) => (refs.get(agent.id) ?? [])
            .filter((ref) => ref.skillId !== skillId)
            .map((ref) => ({ id: ref.skillId, versionId: ref.versionId }));
        const nameOf = await this.runtimeNames(agents.flatMap(otherRefs), ctx);
        const clashing = agents.filter((agent) => (0, skill_names_1.renameIntroducesClash)(otherRefs(agent).flatMap((ref) => nameOf(ref) ?? []), oldName, newName));
        if (clashing.length > 0) {
            throw new errors_1.UserError(`Cannot rename to "${newName}": ${clashing.map((agent) => agent.name).join(', ')} already ${clashing.length > 1 ? 'use' : 'uses'} a skill with a name like that.`);
        }
    }
    async snapshotForPublish(refs, ctx) {
        const refIds = [...new Set(refs.map((ref) => ref.id))];
        await this.skillRepository.lockForPublish(refIds, ctx);
        const rows = await this.resolveRows(refs, ctx);
        const versionByRef = new Map([...rows].map(([refId, row]) => [refId, row.version.id]));
        return { skills: toRecord(rows), versionByRef };
    }
    async pinForPublish(agentVersionId, versionByRef, ctx) {
        await this.skillRepository.insertPins([...versionByRef].map(([skillId, skillVersionId]) => ({
            agentVersionId,
            skillId,
            skillVersionId,
        })), ctx);
    }
    async restoreFromVersion(agentVersionId, refs, ctx = {}) {
        const pinned = await this.skillRepository.findPinned(agentVersionId, ctx);
        return refs.map(({ versionId: _dropped, ...ref }) => {
            const row = pinned.get(ref.id);
            return row ? { ...ref, versionId: row.version.id } : ref;
        });
    }
    isAttachable(skill, agent) {
        if (skill.agentId !== null)
            return skill.agentId === agent.id;
        return skill.projectId === null || skill.projectId === agent.projectId;
    }
    async checkRefs(agent, refs, ctx = {}) {
        const current = (await this.skillRepository.findDependencies([agent.id], ctx)).get(agent.id) ?? [];
        const existingIds = new Set(current.map((ref) => ref.skillId));
        const existingPins = new Map(current.map((ref) => [ref.skillId, ref.versionId]));
        const found = new Map((await this.skillRepository.findByIds(refs.map((ref) => ref.id), ctx)).map((skill) => [skill.id, skill]));
        const kept = refs
            .filter((ref) => existingIds.has(ref.id) || found.has(ref.id))
            .map(({ versionId, ...ref }) => versionId !== undefined && existingPins.get(ref.id) === versionId
            ? { ...ref, versionId }
            : ref);
        const newIds = [...new Set(kept.map((ref) => ref.id))].filter((id) => !existingIds.has(id) && found.has(id));
        if (newIds.length === 0)
            return kept;
        if (ctx.trx)
            await this.skillRepository.lockForPublish(newIds, ctx);
        const keptExisting = kept.filter((ref) => existingIds.has(ref.id));
        const newRefs = newIds.map((id) => ({ id }));
        const nameOf = await this.runtimeNames([...keptExisting, ...newRefs], ctx);
        for (const id of newIds) {
            const skill = found.get(id);
            if (skill && !this.isAttachable(skill, agent)) {
                throw new errors_1.UserError(`Skill "${nameOf({ id }) ?? id}" (${id}) is not available to this agent. An agent can use the skills of its own project, its own skills and instance skills.`);
            }
        }
        const clashes = (0, skill_names_1.findIntroducedNameClashes)(keptExisting.flatMap((ref) => nameOf(ref) ?? []), newRefs.flatMap((ref) => nameOf(ref) ?? []));
        if (clashes.length > 0) {
            throw new errors_1.UserError(`This agent already has a skill with a name like "${clashes.join('", "')}". Rename one of them, or detach the other skill first.`);
        }
        return kept;
    }
    async changeTarget(skillId, target, keepAgentId, ctx = {}, { nameAfterMove, checkedSource } = {}) {
        await this.txRunner.run(ctx, async (txCtx) => {
            await this.skillRepository.lockForEdit([skillId], txCtx);
            if (checkedSource) {
                const [locked] = await this.skillRepository.findByIds([skillId], txCtx);
                if (!locked)
                    throw new errors_1.NotFoundError('Skill not found');
                if (locked.projectId !== checkedSource.projectId ||
                    locked.agentId !== checkedSource.agentId) {
                    throw new errors_1.ConflictError('The skill was moved somewhere else. Reload to see where it is now.');
                }
            }
            const others = (await this.skillRepository.findUsingAgentIds(skillId, txCtx)).filter((id) => id !== keepAgentId);
            if (others.length > 0) {
                throw new errors_1.ConflictError(keepAgentId
                    ? 'Other agents use this skill. Detach it from those agents first, then change where it can be added.'
                    : 'Agents use this skill. Detach it from every agent first, then change where it can be added.');
            }
            const name = nameAfterMove ??
                (await this.skillRepository.findLatestSummaries([skillId], txCtx)).get(skillId)?.name;
            if (name)
                await this.assertNameFree(name, target, skillId, txCtx);
            await this.skillRepository.updateTarget(skillId, target, txCtx);
        });
    }
    async projectOf(skill, ctx = {}) {
        if (skill.projectId)
            return skill.projectId;
        if (!skill.agentId)
            return null;
        const agent = (await this.skillRepository.findAgents([skill.agentId], ctx)).get(skill.agentId);
        return agent?.projectId ?? null;
    }
    async canAccess(user, skill, operation) {
        const projectId = await this.projectOf(skill);
        if (projectId) {
            return await (0, check_access_1.userHasScopes)(user, [`projectSkill:${operation}`], false, { projectId });
        }
        return this.canAccessInstanceSkill(user, skill, operation);
    }
    async accessCheck(user, operation) {
        const projectIds = await this.projectScopeService.getProjectIds(user, [
            `projectSkill:${operation}`,
        ]);
        const allowed = projectIds === null ? null : new Set(projectIds);
        return (skill, projectId) => projectId
            ? allowed === null || allowed.has(projectId)
            : this.canAccessInstanceSkill(user, skill, operation);
    }
    canAccessInstanceSkill(user, skill, operation) {
        if (skill.agentId === null && operation === 'read')
            return true;
        return (0, permissions_1.hasGlobalScope)(user, `skill:${operation}`);
    }
    async canEdit(user, skill) {
        return await this.canAccess(user, skill, 'update');
    }
    async assertCanMove(user, skillId) {
        const [skill] = await this.skillRepository.findByIds([skillId]);
        if (!skill)
            throw new errors_1.NotFoundError('Skill not found');
        if (!(await this.canAccess(user, skill, 'delete'))) {
            throw new errors_1.ForbiddenError('You are not allowed to move this skill out of its scope.');
        }
        return { projectId: skill.projectId, agentId: skill.agentId };
    }
    async assertCanEdit(user, skillIds, ctx = {}) {
        const skills = await this.skillRepository.findByIds(skillIds, ctx);
        const names = await this.latestNames(skills.map((skill) => skill.id), ctx);
        const denied = [];
        for (const skill of skills) {
            if (!(await this.canEdit(user, skill))) {
                denied.push(`"${names.get(skill.id) ?? skill.id}" (${skill.id})`);
            }
        }
        if (denied.length > 0) {
            throw new errors_1.ForbiddenError(`You can use but not edit ${denied.join(', ')}. Ask someone who can edit ${denied.length > 1 ? 'these skills' : 'this skill'}, or detach it from this agent.`);
        }
    }
    async deleteSkill(skillId, agentProjectIds = 'all', ctx = {}) {
        await this.txRunner.run(ctx, async (txCtx) => {
            const [skill] = await this.skillRepository.findByIds([skillId], txCtx);
            if (!skill)
                throw new errors_1.NotFoundError('Skill not found');
            await this.skillRepository.lockForEdit([skillId], txCtx);
            const usage = await this.skillRepository.findUsage(skillId, agentProjectIds, txCtx);
            if (usage.drafts.length > 0 || usage.pins.length > 0 || usage.hiddenAgents > 0) {
                const name = (await this.latestNames([skillId], txCtx)).get(skillId) ?? skillId;
                const users = [
                    ...usage.drafts.map((draft) => `${draft.agentName} (draft)`),
                    ...usage.pins.map((pin) => `${pin.agentName} (${pin.version === null ? 'older published version' : `published v${pin.version}`})`),
                ];
                if (usage.hiddenAgents > 0) {
                    users.push(`${usage.hiddenAgents} ${usage.hiddenAgents === 1 ? 'agent' : 'agents'} in other projects`);
                }
                throw new errors_1.ConflictError(`Skill "${name}" is used by ${[...new Set(users)].join(', ')} and cannot be deleted.`);
            }
            await this.skillRepository.deleteSkill(skillId, txCtx);
        });
        this.logger.debug('Deleted skill', { skillId });
    }
};
exports.SkillService = SkillService;
exports.SkillService = SkillService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, skill_repository_1.SkillRepository, agent_repository_1.AgentRepository, db_1.TransactionRunner, agent_update_broadcaster_1.AgentUpdateBroadcaster, backend_services_1.ProjectScopeService])
], SkillService);
//# sourceMappingURL=skill.service.js.map