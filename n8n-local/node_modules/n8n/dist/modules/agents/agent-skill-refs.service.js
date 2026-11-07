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
exports.AgentSkillRefsService = void 0;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const agent_document_1 = require("./json-config/agent-document");
const agent_repository_1 = require("./repositories/agent.repository");
const skill_repository_1 = require("./repositories/skill.repository");
const skill_service_1 = require("./skills/skill.service");
const skills_hub_rollout_1 = require("./skills/skills-hub-rollout");
const agent_config_hash_1 = require("./utils/agent-config-hash");
const agent_missing_skill_ids_1 = require("./utils/agent-missing-skill-ids");
const agent_resource_id_1 = require("./utils/agent-resource-id");
let AgentSkillRefsService = class AgentSkillRefsService {
    constructor(skillRepository, skillService, agentRepository, rollout) {
        this.skillRepository = skillRepository;
        this.skillService = skillService;
        this.agentRepository = agentRepository;
        this.rollout = rollout;
    }
    get usesSkillsHub() {
        return this.rollout.isEnabled;
    }
    async refsForDraft(agent, ctx) {
        if (!this.usesSkillsHub)
            return readLegacyRefs(agent.schema);
        const rows = (await this.skillRepository.findDependencies([agent.id], ctx)).get(agent.id) ?? [];
        return toSkillRefs(rows.map(({ skillId, versionId }) => ({ id: skillId, ...(versionId ? { versionId } : {}) })));
    }
    async refsForVersion(version, ctx) {
        if (!this.usesSkillsHub)
            return readLegacyRefs(version.schema);
        const skillIds = await this.skillRepository.findPinnedSkillIds(version.versionId, ctx);
        return toSkillRefs(skillIds.map((id) => ({ id })));
    }
    async readDraft(agent, ctx) {
        const skillRefs = await this.refsForDraft(agent, ctx);
        return { skillRefs, skills: await this.skillsForRefs(agent, skillRefs, ctx) };
    }
    async readVersion(version, ctx) {
        if (!this.usesSkillsHub) {
            const skillRefs = readLegacyRefs(version.schema);
            return { skillRefs, skills: pickBodies(version.skills ?? {}, skillRefs) };
        }
        const pinned = await this.skillRepository.findPinned(version.versionId, ctx);
        const skillRefs = toSkillRefs([...pinned.keys()].map((id) => ({ id })));
        const skills = Object.fromEntries([...pinned].map(([skillId, row]) => [skillId, (0, skill_service_1.toAgentSkill)(row)]));
        return { skillRefs, skills };
    }
    async skillsForRefs(agent, skillRefs, ctx) {
        if (!skillRefs?.length)
            return {};
        if (!this.usesSkillsHub)
            return pickBodies(agent.skills ?? {}, skillRefs);
        return await this.skillService.resolveForAgentDraft(toServiceRefs(skillRefs), ctx);
    }
    async findOutdatedSkillIds(skillRefs, skills, ctx) {
        if (!this.usesSkillsHub)
            return [];
        const pinnedSkillIds = skillRefs.flatMap((ref) => (ref.versionId ? [ref.id] : []));
        const latestSkills = await this.skillsForRefs({ skills: {} }, pinnedSkillIds.map((id) => ({ type: 'skill', id })), ctx);
        return pinnedSkillIds.filter((id) => {
            const latest = latestSkills[id];
            const pinned = skills[id];
            return (latest !== undefined &&
                pinned !== undefined &&
                (0, agent_config_hash_1.getAgentSkillHash)(latest) !== (0, agent_config_hash_1.getAgentSkillHash)(pinned));
        });
    }
    async effectiveDraftRefs(agent, refs, ctx) {
        if (!this.usesSkillsHub) {
            const existingIds = new Set(readLegacyRefs(agent.schema).map((ref) => ref.id));
            return refs.filter((ref) => existingIds.has(ref.id) || Object.hasOwn(agent.skills ?? {}, ref.id));
        }
        const checked = await this.skillService.checkRefs({ id: agent.id, projectId: agent.projectId }, toServiceRefs(refs), ctx);
        return toSkillRefs(checked);
    }
    async replaceDraftRefs(agent, refs, ctx) {
        if (!agent.schema && refs?.length) {
            throw new n8n_workflow_1.UnexpectedError('Cannot set skill refs on an agent without a config');
        }
        if (!this.usesSkillsHub) {
            if (!agent.schema)
                return;
            const existingIds = new Set(readLegacyRefs(agent.schema).map((ref) => ref.id));
            const kept = (refs ?? []).filter((ref) => existingIds.has(ref.id) || Object.hasOwn(agent.skills ?? {}, ref.id));
            await this.writeLegacyDraft(agent, agent.schema, kept, agent.skills ?? {}, ctx);
            return;
        }
        const checked = await this.skillService.checkRefs({ id: agent.id, projectId: agent.projectId }, toServiceRefs(refs ?? []), ctx);
        await this.writeDependencies(agent.id, checked, ctx);
    }
    async restoreDraftRefs(agent, version, refs, ctx) {
        if (!this.usesSkillsHub) {
            if (!agent.schema)
                return;
            await this.writeLegacyDraft(agent, agent.schema, refs ?? [], (0, n8n_workflow_1.deepCopy)(version.skills ?? {}), ctx);
            return;
        }
        const restored = await this.skillService.restoreFromVersion(version.versionId, toServiceRefs(refs ?? []), ctx);
        await this.writeDependencies(agent.id, restored, ctx);
    }
    async unpinDraftRef(agent, skillId, ctx) {
        const refs = await this.refsForDraft(agent, ctx);
        await this.writeDependencies(agent.id, refs.map(({ id, versionId }) => (id === skillId || !versionId ? { id } : { id, versionId })), ctx);
    }
    async createDraftRefs(agent, refs, bodies, creator, ctx) {
        if (!refs?.length)
            return [];
        if (!this.usesSkillsHub) {
            if (!agent.schema)
                return [];
            const kept = refs.filter((ref) => Object.hasOwn(bodies, ref.id));
            await this.writeLegacyDraft(agent, agent.schema, kept, pickBodies(bodies, kept), ctx);
            return readLegacyRefs(agent.schema);
        }
        const found = new Map((await this.skillRepository.findByIds(refs.map((ref) => ref.id), ctx)).map((skill) => [skill.id, skill]));
        const otherAgents = await this.skillRepository.findAgents([...found.values()].flatMap((skill) => skill.agentId && skill.agentId !== agent.id ? [skill.agentId] : []), ctx);
        const otherAgentSkillIds = refs.flatMap((ref) => {
            const skill = found.get(ref.id);
            if (!skill?.agentId || skill.agentId === agent.id)
                return [];
            return otherAgents.get(skill.agentId)?.projectId === agent.projectId ? [ref.id] : [];
        });
        const otherAgentBodies = otherAgentSkillIds.length > 0
            ? await this.skillService.resolveForAgentDraft(otherAgentSkillIds.map((id) => ({ id })), ctx)
            : {};
        const next = [];
        for (const ref of refs) {
            const skill = found.get(ref.id);
            const copiesAgentSkill = otherAgentSkillIds.includes(ref.id);
            if (skill && !copiesAgentSkill) {
                next.push({ type: 'skill', id: ref.id });
                continue;
            }
            const source = copiesAgentSkill ? otherAgentBodies : bodies;
            const body = Object.hasOwn(source, ref.id) ? source[ref.id] : undefined;
            if (!body || creator === null)
                continue;
            const id = await this.skillService.create({
                target: { projectId: null, agentId: agent.id },
                skill: body,
                source: 'agent',
                createdById: creator.id,
            }, ctx);
            next.push({ type: 'skill', id });
        }
        await this.replaceDraftRefs(agent, next, ctx);
        return toSkillRefs(next);
    }
    async createSkills(agent, skills, creatorId, availableTo, ctx) {
        if (!this.usesSkillsHub) {
            const bodies = { ...(agent.skills ?? {}) };
            const ids = skills.map((skill) => {
                const id = (0, agent_resource_id_1.generateAgentResourceId)('skill', Object.keys(bodies));
                bodies[id] = skill;
                return id;
            });
            agent.skills = bodies;
            await this.agentRepository.updateDraftSkills(agent, ctx);
            return ids;
        }
        const ids = [];
        for (const skill of skills) {
            ids.push(await this.skillService.create({
                target: targetFor(agent, availableTo),
                skill,
                source: 'agent',
                createdById: creatorId,
                checkNameTaken: true,
            }, ctx));
        }
        return ids;
    }
    async versionSnapshot(agent, ctx) {
        if (!agent.schema)
            return { schema: null, skills: null, pins: new Map() };
        if (!this.usesSkillsHub) {
            const skillRefs = readLegacyRefs(agent.schema);
            const skills = pickBodies(agent.skills ?? {}, skillRefs);
            const missing = (0, agent_missing_skill_ids_1.getMissingSkillIds)(skillRefs, skills);
            if (missing.length > 0) {
                throw new n8n_workflow_1.UserError(`Cannot publish agent with missing skill bodies: ${missing.join(', ')}`);
            }
            return { schema: agent.schema, skills: (0, n8n_workflow_1.deepCopy)(skills), pins: new Map() };
        }
        const refs = await this.refsForDraft(agent, ctx);
        if (refs.length === 0) {
            return {
                schema: {
                    ...(0, agent_document_1.withoutLegacySkillRefs)(agent.schema),
                    skills: [],
                },
                skills: {},
                pins: new Map(),
            };
        }
        const { skills, versionByRef } = await this.skillService.snapshotForPublish(toServiceRefs(refs), ctx);
        const missing = refs.filter((ref) => !versionByRef.has(ref.id)).map((ref) => ref.id);
        if (missing.length > 0) {
            throw new n8n_workflow_1.UserError(`Cannot publish agent with missing skills: ${missing.join(', ')}`);
        }
        const schema = {
            ...(0, agent_document_1.withoutLegacySkillRefs)(agent.schema),
            skills: refs.map(({ id }) => ({ type: 'skill', id })),
        };
        return { schema, skills, pins: versionByRef };
    }
    async pinVersion(agentVersionId, snapshot, ctx) {
        if (snapshot.pins.size === 0)
            return;
        await this.skillService.pinForPublish(agentVersionId, snapshot.pins, ctx);
    }
    async availabilityOf(skillId, ctx) {
        const [skill] = await this.skillRepository.findByIds([skillId], ctx);
        if (!skill)
            return undefined;
        if (skill.agentId)
            return 'agent';
        return skill.projectId ? 'project' : 'instance';
    }
    async setAvailability(agent, skillId, availableTo, ctx, options = {}) {
        await this.skillService.changeTarget(skillId, targetFor(agent, availableTo), agent.id, ctx, options);
    }
    async writeLegacyDraft(agent, schema, refs, skills, ctx) {
        const { skills: _previous, ...rest } = schema;
        agent.schema = {
            ...rest,
            skills: refs.map(({ id }) => ({ type: 'skill', id })),
        };
        agent.skills = skills;
        await this.agentRepository.updateDraftSkills(agent, ctx);
    }
    async writeDependencies(agentId, refs, ctx) {
        await this.skillRepository.replaceDependencies(agentId, refs.map((ref) => ({ skillId: ref.id, versionId: ref.versionId ?? null })), ctx);
    }
};
exports.AgentSkillRefsService = AgentSkillRefsService;
exports.AgentSkillRefsService = AgentSkillRefsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [skill_repository_1.SkillRepository, skill_service_1.SkillService, agent_repository_1.AgentRepository, skills_hub_rollout_1.SkillsHubRollout])
], AgentSkillRefsService);
function targetFor(agent, availableTo) {
    return {
        projectId: availableTo === 'project' ? agent.projectId : null,
        agentId: availableTo === 'agent' ? agent.id : null,
    };
}
function readLegacyRefs(schema) {
    const value = schema?.skills;
    if (!Array.isArray(value))
        return [];
    return value.flatMap((ref) => typeof ref?.id === 'string' && ref.enabled !== false
        ? [{ type: 'skill', id: ref.id }]
        : []);
}
function pickBodies(bodies, refs) {
    return Object.fromEntries(refs.flatMap((ref) => (Object.hasOwn(bodies, ref.id) ? [[ref.id, bodies[ref.id]]] : [])));
}
function toServiceRefs(refs) {
    return refs.map(({ id, versionId }) => (versionId ? { id, versionId } : { id }));
}
function toSkillRefs(refs) {
    return refs.map(({ id, versionId }) => ({
        type: 'skill',
        id,
        ...(versionId ? { versionId } : {}),
    }));
}
//# sourceMappingURL=agent-skill-refs.service.js.map