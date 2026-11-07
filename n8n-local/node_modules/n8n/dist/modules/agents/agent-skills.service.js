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
exports.AgentSkillsService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const permissions_1 = require("@n8n/permissions");
const check_access_1 = require("../../permissions.ee/check-access");
const agent_modification_telemetry_service_1 = require("./agent-modification-telemetry.service");
const agent_save_completion_service_1 = require("./agent-save-completion.service");
const agent_skill_refs_service_1 = require("./agent-skill-refs.service");
const agent_config_composition_1 = require("./json-config/agent-config-composition");
const agent_repository_1 = require("./repositories/agent.repository");
const skill_names_1 = require("./skills/skill-names");
const skill_service_1 = require("./skills/skill.service");
const skills_telemetry_1 = require("./skills/skills-telemetry");
const agent_config_hash_1 = require("./utils/agent-config-hash");
const agent_draft_utils_1 = require("./utils/agent-draft.utils");
const get_agent_or_throw_1 = require("./utils/get-agent-or-throw");
const skill_instruction_edits_1 = require("./utils/skill-instruction-edits");
let AgentSkillsService = class AgentSkillsService {
    constructor(logger, agentRepository, saveCompletion, agentSkillRefs, skillService, transactionRunner, skillsTelemetry) {
        this.logger = logger;
        this.agentRepository = agentRepository;
        this.saveCompletion = saveCompletion;
        this.agentSkillRefs = agentSkillRefs;
        this.skillService = skillService;
        this.transactionRunner = transactionRunner;
        this.skillsTelemetry = skillsTelemetry;
    }
    async listSkills(agentId, projectId) {
        const entity = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId, 'Agent not found');
        if (!this.agentSkillRefs.usesSkillsHub)
            return entity.skills ?? {};
        return (await this.agentSkillRefs.readDraft(entity, {})).skills;
    }
    async getSkill(agentId, projectId, skillId) {
        const skills = await this.listSkills(agentId, projectId);
        const skill = Object.hasOwn(skills, skillId) ? skills[skillId] : undefined;
        if (!skill)
            throw new errors_1.NotFoundError('Skill not found');
        return skill;
    }
    async createAndAttachSkills(agentId, projectId, skills, context) {
        const { results, saved, skillRefs } = await this.createSkillsBatch(agentId, projectId, skills, context);
        return {
            skills: results,
            configHash: (0, agent_config_hash_1.getAgentConfigHash)((0, agent_config_composition_1.composeJsonConfig)(saved, skillRefs)),
        };
    }
    async createAndAttachSkill(agentId, projectId, skill, context, availableTo = 'project', method) {
        const { results } = await this.createSkillsBatch(agentId, projectId, [skill], context, availableTo, method);
        return results[0];
    }
    async createSkillsBatch(agentId, projectId, skills, context, availableTo = 'project', method) {
        if (skills.length === 0) {
            throw new n8n_workflow_1.UserError('At least one skill is required.');
        }
        const entity = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId, 'Agent not found');
        if (!entity.schema)
            throw new n8n_workflow_1.UserError('Agent has no JSON config yet.');
        const bodies = skills.map((skill) => {
            const validated = this.validateSkill(skill);
            return this.agentSkillRefs.usesSkillsHub
                ? (0, skill_service_1.withTrimmedName)(toStoredSkill(validated))
                : validated;
        });
        if (this.agentSkillRefs.usesSkillsHub) {
            await this.assertCanCreateSkills(context.user, entity.projectId, availableTo);
        }
        const previous = await this.agentSkillRefs.readDraft(entity, {});
        this.assertNoNameClashes(previous.skills, bodies);
        const snapshot = (0, agent_modification_telemetry_service_1.captureAgentMutation)(entity, previous.skillRefs);
        (0, agent_draft_utils_1.markAgentDraftDirty)(entity);
        const { ids, skillRefs } = await this.transactionRunner.run({}, async (ctx) => {
            await (0, agent_draft_utils_1.saveAgentDraftFenced)(this.agentRepository, entity, ctx);
            const created = await this.agentSkillRefs.createSkills(entity, bodies, context.user.id, availableTo, ctx);
            const nextRefs = [
                ...(previous.skillRefs ?? []),
                ...created.map((id) => ({ type: 'skill', id })),
            ];
            await this.agentSkillRefs.replaceDraftRefs(entity, nextRefs, ctx);
            return {
                ids: created,
                skillRefs: await this.agentSkillRefs.refsForDraft(entity, ctx),
            };
        });
        await this.saveCompletion.bodySaved((0, agent_modification_telemetry_service_1.buildAgentMutationEvent)(entity, skillRefs, projectId, context, snapshot, { skills: true }), context.pushRef);
        this.logger.debug('Created and attached agent skills', { agentId, projectId, skillIds: ids });
        if (this.agentSkillRefs.usesSkillsHub) {
            await this.skillsTelemetry.created(context.user.id, ids, telemetrySourceOf(context), telemetryMethodOf(context, method));
        }
        return {
            results: ids.map((id, index) => ({
                id,
                skill: bodies[index],
                skillHash: (0, agent_config_hash_1.getAgentSkillHash)(bodies[index]),
                versionId: entity.versionId,
            })),
            saved: entity,
            skillRefs,
        };
    }
    async updateSkill(agentId, projectId, skillId, updates, context, baseSkillHash, instructionEdits, availableTo) {
        const entity = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId, 'Agent not found');
        const skillRefs = (await this.agentSkillRefs.refsForDraft(entity, {})) ?? [];
        const ref = skillRefs.find((candidate) => candidate.id === skillId);
        const existing = !this.agentSkillRefs.usesSkillsHub
            ?
                legacyBody(entity, skillId)
            : ref && (await this.agentSkillRefs.skillsForRefs(entity, [ref], {}))[skillId];
        if (!existing)
            throw new errors_1.NotFoundError('Skill not found');
        if (baseSkillHash !== undefined && baseSkillHash !== (0, agent_config_hash_1.getAgentSkillHash)(existing)) {
            throw new errors_1.ConflictError('Skill was changed elsewhere; reload to get the latest version');
        }
        const { allowedTools, ...changes } = updates;
        const updated = { ...existing, ...changes };
        if (!this.agentSkillRefs.usesSkillsHub && 'allowedTools' in updates) {
            if (allowedTools?.length)
                updated.allowedTools = allowedTools;
            else
                delete updated.allowedTools;
        }
        if (instructionEdits?.length) {
            if (updates.instructions !== undefined) {
                throw new n8n_workflow_1.UserError('Pass either instructions or instructionEdits, not both.');
            }
            updated.instructions = (0, skill_instruction_edits_1.applySkillInstructionEdits)(existing.instructions, instructionEdits);
        }
        if ('references' in updates && !updates.references?.length)
            delete updated.references;
        this.validateSkill(updated);
        const nextAvailability = await this.availabilityChange(skillId, availableTo);
        let checkedSource;
        if (nextAvailability) {
            await this.skillService.assertCanEdit(context.user, [skillId]);
            checkedSource = await this.skillService.assertCanMove(context.user, skillId);
            await this.assertCanCreateSkills(context.user, entity.projectId, nextAvailability);
        }
        if ((0, isEqual_1.default)(existing, updated)) {
            if (nextAvailability) {
                await this.agentSkillRefs.setAvailability(entity, skillId, nextAvailability, {}, {
                    checkedSource,
                });
            }
            return {
                id: skillId,
                skill: existing,
                skillHash: (0, agent_config_hash_1.getAgentSkillHash)(existing),
                versionId: entity.versionId,
            };
        }
        if (!this.agentSkillRefs.usesSkillsHub) {
            return await this.updateLegacySkill(entity, skillRefs, skillId, updated, projectId, context);
        }
        const pinned = ref?.versionId !== undefined;
        if (pinned) {
            const latest = (await this.agentSkillRefs.skillsForRefs(entity, [{ type: 'skill', id: skillId }], {}))[skillId];
            if (!latest || (0, agent_config_hash_1.getAgentSkillHash)(latest) !== (0, agent_config_hash_1.getAgentSkillHash)(existing)) {
                throw new n8n_workflow_1.UserError('This agent uses an older version of this skill. Use the latest version first, then edit the skill. To use the latest version, remove versionId from the skill ref in the agent config.');
            }
        }
        await this.skillService.assertCanEdit(context.user, [skillId]);
        const snapshot = (0, agent_modification_telemetry_service_1.captureAgentMutation)(entity, skillRefs);
        if (pinned)
            (0, agent_draft_utils_1.markAgentDraftDirty)(entity);
        const saved = await this.transactionRunner.run({}, async (ctx) => {
            if (nextAvailability) {
                await this.agentSkillRefs.setAvailability(entity, skillId, nextAvailability, ctx, {
                    nameAfterMove: updated.name,
                    checkedSource,
                });
            }
            if (pinned) {
                await (0, agent_draft_utils_1.saveAgentDraftFenced)(this.agentRepository, entity, ctx);
                await this.agentSkillRefs.unpinDraftRef(entity, skillId, ctx);
            }
            return await this.skillService.save(skillId, {
                name: updated.name,
                description: updated.description,
                instructions: updated.instructions,
                references: updated.references ?? [],
                baseSkillHash: (0, agent_config_hash_1.getAgentSkillHash)(existing),
            }, context.user.id, ctx);
        });
        await this.skillService.refreshFollowingAgents(saved.followingAgentIds.filter((id) => id !== entity.id), context.pushRef);
        const fresh = (await this.agentRepository.findByIdAndProjectId(entity.id, projectId)) ?? entity;
        await this.saveCompletion.bodySaved((0, agent_modification_telemetry_service_1.buildAgentMutationEvent)(fresh, await this.agentSkillRefs.refsForDraft(fresh, {}), projectId, context, snapshot, { skills: true }), context.pushRef);
        if (saved.created) {
            await this.skillsTelemetry.updated(context.user.id, skillId, telemetrySourceOf(context), saved.version, nextAvailability !== undefined);
        }
        this.logger.debug('Updated agent skill', {
            agentId,
            projectId,
            skillId,
            version: saved.version,
            created: saved.created,
        });
        return {
            id: skillId,
            skill: saved.skill,
            skillHash: (0, agent_config_hash_1.getAgentSkillHash)(saved.skill),
            versionId: fresh.versionId,
        };
    }
    async deleteSkill(agentId, projectId, skillId, context) {
        const entity = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId, 'Agent not found');
        const previousSkillRefs = await this.agentSkillRefs.refsForDraft(entity, {});
        if (!previousSkillRefs?.some((ref) => ref.id === skillId)) {
            throw new errors_1.NotFoundError('Skill not found');
        }
        const snapshot = (0, agent_modification_telemetry_service_1.captureAgentMutation)(entity, previousSkillRefs);
        (0, agent_draft_utils_1.markAgentDraftDirty)(entity);
        const skillRefs = await this.transactionRunner.run({}, async (ctx) => {
            await (0, agent_draft_utils_1.saveAgentDraftFenced)(this.agentRepository, entity, ctx);
            await this.agentSkillRefs.replaceDraftRefs(entity, previousSkillRefs.filter((ref) => ref.id !== skillId), ctx);
            return await this.agentSkillRefs.refsForDraft(entity, ctx);
        });
        await this.saveCompletion.bodySaved((0, agent_modification_telemetry_service_1.buildAgentMutationEvent)(entity, skillRefs, projectId, context, snapshot, { skills: true }), context.pushRef);
        this.logger.debug('Detached agent skill', { agentId, projectId, skillId });
    }
    async availabilityChange(skillId, availableTo) {
        if (availableTo === undefined || !this.agentSkillRefs.usesSkillsHub)
            return undefined;
        const current = await this.agentSkillRefs.availabilityOf(skillId, {});
        return current === availableTo ? undefined : availableTo;
    }
    async updateLegacySkill(entity, skillRefs, skillId, updated, projectId, context) {
        const { [skillId]: _self, ...others } = entity.skills ?? {};
        this.assertNoNameClashes(others, [updated]);
        const snapshot = (0, agent_modification_telemetry_service_1.captureAgentMutation)(entity, skillRefs);
        entity.skills = { ...entity.skills, [skillId]: updated };
        (0, agent_draft_utils_1.markAgentDraftDirty)(entity);
        await this.transactionRunner.run({}, async (ctx) => {
            await (0, agent_draft_utils_1.saveAgentDraftFenced)(this.agentRepository, entity, ctx);
        });
        await this.saveCompletion.bodySaved((0, agent_modification_telemetry_service_1.buildAgentMutationEvent)(entity, skillRefs, projectId, context, snapshot, { skills: true }), context.pushRef);
        this.logger.debug('Updated agent skill', { agentId: entity.id, projectId, skillId });
        return {
            id: skillId,
            skill: updated,
            skillHash: (0, agent_config_hash_1.getAgentSkillHash)(updated),
            versionId: entity.versionId,
        };
    }
    validateSkill(skill) {
        const result = api_types_1.agentSkillSchema.safeParse(skill);
        if (!result.success) {
            throw new n8n_workflow_1.UserError(`Invalid agent skill: ${result.error.issues[0]?.message ?? 'Invalid skill'}`);
        }
        return result.data;
    }
    async assertCanCreateSkills(user, projectId, availableTo) {
        if (availableTo === 'agent')
            return;
        if (availableTo === 'instance') {
            if (!(0, permissions_1.hasGlobalScope)(user, 'skill:create')) {
                throw new errors_1.ForbiddenError('You are not allowed to create skills for the whole instance.');
            }
            return;
        }
        if (!(await (0, check_access_1.userHasScopes)(user, ['projectSkill:create'], false, { projectId }))) {
            throw new errors_1.ForbiddenError('You are not allowed to create skills for this project.');
        }
    }
    assertNoNameClashes(existing, added) {
        const quote = (names) => names.map((name) => name.trim()).join('", "');
        const existingNames = Object.values(existing).map((skill) => skill.name);
        const clashes = added
            .map((skill) => skill.name)
            .filter((name) => (0, skill_names_1.findIntroducedNameClashes)(existingNames, [name]).length > 0);
        if (clashes.length > 0) {
            throw new n8n_workflow_1.UserError(`Agent already has a skill with a name like "${quote(clashes)}".`);
        }
        const inBatch = (0, skill_names_1.findNameClashGroups)(added.map((skill) => skill.name));
        if (inBatch.length > 0) {
            throw new n8n_workflow_1.UserError(`The new skills "${quote(inBatch[0])}" are hard to tell apart.`);
        }
    }
};
exports.AgentSkillsService = AgentSkillsService;
exports.AgentSkillsService = AgentSkillsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_repository_1.AgentRepository, agent_save_completion_service_1.AgentSaveCompletionService, agent_skill_refs_service_1.AgentSkillRefsService, skill_service_1.SkillService, db_1.TransactionRunner, skills_telemetry_1.SkillsTelemetry])
], AgentSkillsService);
function legacyBody(agent, skillId) {
    const skills = agent.skills ?? {};
    return Object.hasOwn(skills, skillId) ? skills[skillId] : undefined;
}
function toStoredSkill(skill) {
    return {
        name: skill.name,
        description: skill.description,
        instructions: skill.instructions,
        ...(skill.references?.length ? { references: skill.references } : {}),
    };
}
function telemetrySourceOf(context) {
    return context.modifiedBy === 'mcp' ? 'mcp' : 'agent';
}
function telemetryMethodOf(context, method) {
    return context.modifiedBy === 'user' ? (method ?? 'manual') : 'ai';
}
//# sourceMappingURL=agent-skills.service.js.map