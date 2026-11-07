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
exports.SkillsHubStartupCopy = exports.SKILLS_HUB_COPY_PROGRESS_KEY = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const generate_nano_id_1 = require("@n8n/utils/generate-nano-id");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const agent_repository_1 = require("../repositories/agent.repository");
const skill_repository_1 = require("../repositories/skill.repository");
const skill_content_hash_1 = require("./skill-content-hash");
const skill_service_1 = require("./skill.service");
const skills_hub_rollout_1 = require("./skills-hub-rollout");
const SKILL_ID_MAX_LENGTH = 36;
const BATCH_SIZE = 100;
const WARN_AGENT_IDS = 20;
exports.SKILLS_HUB_COPY_PROGRESS_KEY = 'agents.skillsHubCopy';
let SkillsHubStartupCopy = class SkillsHubStartupCopy {
    constructor(logger, rollout, instanceSettings, agentRepository, skillRepository, txRunner, settingsRepository) {
        this.logger = logger;
        this.rollout = rollout;
        this.instanceSettings = instanceSettings;
        this.agentRepository = agentRepository;
        this.skillRepository = skillRepository;
        this.txRunner = txRunner;
        this.settingsRepository = settingsRepository;
    }
    async runOnStartup() {
        if (this.instanceSettings.instanceType !== 'main')
            return;
        if (this.rollout.isEnabled)
            await this.copyAll();
        else if (this.instanceSettings.isLeader)
            await this.warnAboutHubOnlySkills();
    }
    async copyAll() {
        const counts = {
            scanned: 0,
            skipped: 0,
            agents: 0,
            skills: 0,
            versions: 0,
            pins: 0,
            failed: 0,
        };
        this.logger.info('Started copying inline agent skills into the skills hub');
        const startedAt = Date.now();
        const read = await this.readProgress();
        const progress = read ?? { through: null, retryAgentIds: [] };
        const retry = new Set(progress.retryAgentIds);
        const failedDrafts = [];
        const copiedDrafts = [];
        let after = null;
        for (;;) {
            const agents = await this.agentRepository.findPageForSkillCopy(after, BATCH_SIZE);
            for (const agent of agents) {
                counts.scanned++;
                const draftAllowed = read !== null && (isAfter(agent, progress.through) || retry.has(agent.id));
                try {
                    const copied = await this.copyAgentWithRetry(agent.id, draftAllowed);
                    if (draftAllowed)
                        copiedDrafts.push(agent.id);
                    if (!copied)
                        counts.skipped++;
                    else {
                        this.logger.debug('Copied the inline skills of an agent into the skills hub', {
                            agentId: agent.id,
                            ...copied,
                        });
                        counts.agents++;
                        counts.skills += copied.skills;
                        counts.versions += copied.versions;
                        counts.pins += copied.pins;
                    }
                }
                catch (error) {
                    counts.failed++;
                    if (draftAllowed)
                        failedDrafts.push(agent.id);
                    this.logger.error('Failed to copy the skills of an agent into the skills hub', {
                        agentId: agent.id,
                        errorName: error instanceof Error ? error.name : undefined,
                        error: error instanceof Error ? error.message : String(error),
                    });
                    if (error instanceof Error) {
                        this.logger.debug('Stack of the failed skills hub copy', {
                            agentId: agent.id,
                            stack: error.stack,
                        });
                    }
                }
            }
            if (agents.length > 0)
                after = agents[agents.length - 1];
            if (agents.length < BATCH_SIZE)
                break;
        }
        await this.saveProgress(after, copiedDrafts, failedDrafts);
        this.logger.info('Copied inline agent skills into the skills hub', {
            ...counts,
            durationMs: Date.now() - startedAt,
        });
        return counts;
    }
    async warnAboutHubOnlySkills() {
        const changed = [];
        const withRefs = await this.skillRepository.findAgentIdsWithDraftRefs();
        for (let start = 0; start < withRefs.length; start += BATCH_SIZE) {
            const page = withRefs.slice(start, start + BATCH_SIZE);
            const hubHashes = await this.skillRepository.findDraftContentHashes(page);
            for (const agentId of page) {
                const agent = await this.agentRepository.findForSkillCopy(agentId);
                const inline = agent
                    ? inlineSkills(agent).map(({ body }) => (0, skill_content_hash_1.skillContentHash)((0, skill_service_1.toSkillContent)(body)))
                    : [];
                if (!sameHashes(inline, hubHashes.get(agentId) ?? []))
                    changed.push(agentId);
            }
        }
        const count = changed.length;
        if (count === 0)
            return;
        const agentIds = changed.slice(0, WARN_AGENT_IDS);
        this.logger.warn('The skills hub is off, so agents run their inline skills. Skills that were added or changed in the hub while it was on are not available to these agents until it is on again.', { agents: count, agentIds });
    }
    async copyAgentWithRetry(agentId, draftAllowed) {
        if (!(await this.findWork(agentId, draftAllowed, {})))
            return null;
        try {
            return await this.copyAgent(agentId, draftAllowed);
        }
        catch (error) {
            this.logger.warn('Retrying the skills hub copy of an agent after a failed try', {
                agentId,
                error: error instanceof Error ? error.message : String(error),
            });
            return await this.copyAgent(agentId, draftAllowed);
        }
    }
    async readProgress() {
        const row = await this.settingsRepository.findByKey(exports.SKILLS_HUB_COPY_PROGRESS_KEY);
        if (!row)
            return { through: null, retryAgentIds: [] };
        const progress = parseProgress(row.value);
        if (!progress) {
            this.logger.error('Unreadable skills hub copy progress: no agent draft is copied in this run', { key: exports.SKILLS_HUB_COPY_PROGRESS_KEY });
        }
        return progress;
    }
    async saveProgress(last, copiedDrafts, failedDrafts) {
        const mine = last ? { createdAt: last.createdAt.toISOString(), id: last.id } : null;
        const retryAgentIds = await this.txRunner.run({}, async (ctx) => {
            const row = await this.settingsRepository.findByKeyForUpdate(exports.SKILLS_HUB_COPY_PROGRESS_KEY, ctx);
            const stored = row ? parseProgress(row.value) : null;
            const handled = new Set([...copiedDrafts, ...failedDrafts]);
            const next = {
                through: furthest(stored?.through ?? null, mine),
                retryAgentIds: [
                    ...(stored?.retryAgentIds ?? []).filter((id) => !handled.has(id)),
                    ...failedDrafts,
                ],
            };
            if (row && JSON.stringify(next) === row.value)
                return next.retryAgentIds;
            await this.settingsRepository.upsertByKey(exports.SKILLS_HUB_COPY_PROGRESS_KEY, JSON.stringify(next), false, ctx);
            return next.retryAgentIds;
        });
        if (retryAgentIds.length > 0) {
            this.logger.error('These agent drafts are copied into the skills hub again at the next start', {
                agentIds: retryAgentIds.slice(0, WARN_AGENT_IDS),
                agents: retryAgentIds.length,
            });
        }
    }
    async findWork(agentId, draftAllowed, ctx) {
        const agent = await this.agentRepository.findForSkillCopy(agentId, ctx);
        if (!agent)
            return null;
        const versions = (await this.skillRepository.findUnpinnedVersions(agentId, ctx)).filter((version) => inlineSkills(version).length > 0);
        const copyDraft = draftAllowed &&
            inlineSkills(agent).length > 0 &&
            !(await this.skillRepository.hasHubState(agentId, ctx));
        if (versions.length === 0 && !copyDraft)
            return null;
        return { agent, versions, copyDraft };
    }
    async copyAgent(agentId, draftAllowed) {
        return await this.txRunner.run({}, async (ctx) => {
            await this.agentRepository.lockForSkillCopy(agentId, ctx);
            const work = await this.findWork(agentId, draftAllowed, ctx);
            if (!work)
                return null;
            const { agent, versions, copyDraft } = work;
            const counts = { skills: 0, versions: 0, pins: 0 };
            const state = await this.loadState(agent.id, ctx);
            for (const version of versions) {
                const pins = [];
                for (const { refId, body } of inlineSkills(version)) {
                    const pinned = await this.versionFor(agent, refId, body, false, state, counts, ctx);
                    if (!pins.some((pin) => pin.skillId === pinned.skillId)) {
                        pins.push({
                            agentVersionId: version.versionId,
                            skillId: pinned.skillId,
                            skillVersionId: pinned.id,
                        });
                    }
                }
                await this.skillRepository.insertPins(pins, ctx);
                counts.pins += pins.length;
            }
            if (copyDraft) {
                const refs = [];
                for (const { refId, body } of inlineSkills(agent)) {
                    const { skillId } = await this.versionFor(agent, refId, body, true, state, counts, ctx);
                    if (!refs.some((ref) => ref.skillId === skillId))
                        refs.push({ skillId });
                }
                await this.skillRepository.replaceDependencies(agent.id, refs, ctx);
            }
            return { ...counts, publishedVersions: versions.length, draft: copyDraft };
        });
    }
    async loadState(agentId, ctx) {
        const state = {
            byHash: new Map(),
            skillByRef: new Map(),
            refBySkill: new Map(),
            latest: new Map(),
        };
        for (const row of await this.skillRepository.findAgentSkillVersions(agentId, ctx)) {
            addByHash(state, row.contentHash, { id: row.id, skillId: row.skillId });
            const current = state.latest.get(row.skillId);
            if (!current || row.version > current.version) {
                state.latest.set(row.skillId, {
                    versionId: row.id,
                    hash: row.contentHash,
                    version: row.version,
                });
            }
        }
        return state;
    }
    async versionFor(agent, refId, body, mustBeLatest, state, counts, ctx) {
        const content = (0, skill_service_1.toSkillContent)(body);
        const hash = (0, skill_content_hash_1.skillContentHash)(content);
        const matches = state.byHash.get(hash) ?? [];
        const skillId = state.skillByRef.get(refId) ??
            (await this.ownSkillOfRef(agent, refId, state, ctx)) ??
            matches.find((version) => !state.refBySkill.has(version.skillId))?.skillId;
        if (skillId) {
            claim(state, refId, skillId);
            const match = matches.find((version) => version.skillId === skillId);
            if (match && (!mustBeLatest || state.latest.get(skillId)?.hash === hash))
                return match;
            return await this.addVersion(skillId, content, hash, state, counts, ctx);
        }
        const id = await this.newSkillId(refId, ctx);
        const versionId = await this.skillRepository.createSkill({ id, target: { projectId: null, agentId: agent.id }, source: 'agent', createdById: null }, content, ctx);
        const version = { id: versionId, skillId: id };
        addByHash(state, hash, version);
        claim(state, refId, id);
        state.latest.set(id, { versionId, hash, version: 1 });
        counts.skills++;
        counts.versions++;
        return version;
    }
    async addVersion(skillId, content, hash, state, counts, ctx) {
        const next = (state.latest.get(skillId)?.version ?? 0) + 1;
        const id = await this.skillRepository.insertSavedVersion(skillId, next, content, null, ctx);
        const version = { id, skillId };
        addByHash(state, hash, version);
        state.latest.set(skillId, { versionId: id, hash, version: next });
        counts.versions++;
        return version;
    }
    async ownSkillOfRef(agent, refId, state, ctx) {
        if (!state.latest.has(refId) || state.refBySkill.has(refId))
            return undefined;
        const [skill] = await this.skillRepository.findByIds([refId], ctx);
        return skill?.agentId === agent.id ? refId : undefined;
    }
    async newSkillId(refId, ctx) {
        if (refId.length <= SKILL_ID_MAX_LENGTH &&
            !(await this.skillRepository.existsById(refId, ctx))) {
            return refId;
        }
        return `skill_${(0, generate_nano_id_1.generateNanoId)()}`;
    }
};
exports.SkillsHubStartupCopy = SkillsHubStartupCopy;
exports.SkillsHubStartupCopy = SkillsHubStartupCopy = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, skills_hub_rollout_1.SkillsHubRollout, n8n_core_1.InstanceSettings, agent_repository_1.AgentRepository, skill_repository_1.SkillRepository, db_1.TransactionRunner, db_1.SettingsRepository])
], SkillsHubStartupCopy);
function sameHashes(left, right) {
    if (left.length !== right.length)
        return false;
    const sortedRight = [...right].sort();
    return [...left].sort().every((hash, index) => hash === sortedRight[index]);
}
function addByHash(state, hash, version) {
    const versions = state.byHash.get(hash) ?? [];
    if (!versions.some((known) => known.skillId === version.skillId))
        versions.push(version);
    state.byHash.set(hash, versions);
}
function claim(state, refId, skillId) {
    state.skillByRef.set(refId, skillId);
    state.refBySkill.set(skillId, refId);
}
function inlineSkills(source) {
    const refs = source.schema?.skills;
    if (!Array.isArray(refs))
        return [];
    const bodies = source.skills ?? {};
    const seen = new Set();
    const result = [];
    for (const ref of refs) {
        if (!isRecord(ref) || ref.type !== 'skill' || typeof ref.id !== 'string')
            continue;
        if (ref.enabled === false || seen.has(ref.id))
            continue;
        seen.add(ref.id);
        const body = toInlineBody(Object.hasOwn(bodies, ref.id) ? bodies[ref.id] : undefined);
        if (body)
            result.push({ refId: ref.id, body });
    }
    return result;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function toInlineBody(raw) {
    if (!isRecord(raw))
        return null;
    const { name, description, instructions, references } = raw;
    if (typeof name !== 'string' ||
        typeof description !== 'string' ||
        typeof instructions !== 'string') {
        return null;
    }
    const files = new Map();
    if (Array.isArray(references)) {
        for (const file of references) {
            if (isRecord(file) &&
                typeof file.path === 'string' &&
                typeof file.content === 'string' &&
                !files.has(file.path)) {
                files.set(file.path, { path: file.path, content: file.content });
            }
        }
    }
    return {
        name,
        description,
        instructions,
        ...(files.size > 0 ? { references: [...files.values()] } : {}),
    };
}
function parseProgress(raw) {
    const value = (0, n8n_workflow_1.jsonParse)(raw, { fallbackValue: null });
    if (!isRecord(value) || !Array.isArray(value.retryAgentIds))
        return null;
    const through = isRecord(value.through) ? value.through : null;
    if (value.through !== null &&
        (typeof through?.createdAt !== 'string' || typeof through.id !== 'string')) {
        return null;
    }
    return {
        through: through ? { createdAt: String(through.createdAt), id: String(through.id) } : null,
        retryAgentIds: value.retryAgentIds.filter((id) => typeof id === 'string'),
    };
}
function furthest(left, right) {
    if (!left)
        return right;
    if (!right)
        return left;
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();
    if (leftTime !== rightTime)
        return leftTime > rightTime ? left : right;
    return left.id >= right.id ? left : right;
}
function isAfter(agent, through) {
    if (!through)
        return true;
    const time = agent.createdAt.getTime();
    const throughTime = new Date(through.createdAt).getTime();
    return time > throughTime || (time === throughTime && agent.id > through.id);
}
//# sourceMappingURL=skills-hub-startup-copy.js.map