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
exports.SkillRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const node_crypto_1 = require("node:crypto");
const agent_version_skill_dependency_entity_1 = require("../entities/agent-version-skill-dependency.entity");
const agent_history_entity_1 = require("../entities/agent-history.entity");
const agent_skill_dependency_entity_1 = require("../entities/agent-skill-dependency.entity");
const agent_entity_1 = require("../entities/agent.entity");
const skill_file_entity_1 = require("../entities/skill-file.entity");
const skill_version_entity_1 = require("../entities/skill-version.entity");
const skill_entity_1 = require("../entities/skill.entity");
const skill_content_hash_1 = require("../skills/skill-content-hash");
let SkillRepository = class SkillRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(skill_entity_1.Skill, dataSource.manager, transactionRunner);
    }
    async findVisiblePage(visibility, filter, ctx = {}) {
        const manager = this.managerFor(ctx);
        const agentsOf = (projectCondition) => manager
            .createQueryBuilder()
            .subQuery()
            .select('owner.id')
            .from(agent_entity_1.Agent, 'owner')
            .where(projectCondition)
            .getQuery();
        const { projectIds } = visibility;
        const branches = [];
        if (!filter.scope || filter.scope === 'instance') {
            branches.push('skill.projectId IS NULL AND skill.agentId IS NULL');
        }
        if (filter.attachableTo !== undefined) {
            if (projectIds === 'all' || projectIds.includes(filter.attachableTo.projectId)) {
                branches.push('skill.projectId = :attachProjectId', 'skill.agentId = :attachAgentId');
            }
        }
        else {
            if (!filter.scope || filter.scope === 'project') {
                if (projectIds === 'all')
                    branches.push('skill.projectId IS NOT NULL');
                else if (projectIds.length > 0)
                    branches.push('skill.projectId IN (:...projectIds)');
            }
            if (!filter.scope || filter.scope === 'agent') {
                if (projectIds === 'all')
                    branches.push('skill.agentId IS NOT NULL');
                else if (projectIds.length > 0) {
                    branches.push(`skill.agentId IN ${agentsOf('owner.projectId IN (:...projectIds)')}`);
                }
            }
        }
        if (branches.length === 0)
            return { skills: [], count: 0 };
        const query = manager
            .createQueryBuilder(skill_entity_1.Skill, 'skill')
            .where(new typeorm_1.Brackets((qb) => branches.forEach((branch) => qb.orWhere(`(${branch})`))))
            .setParameters({
            projectIds,
            ...(filter.attachableTo !== undefined && {
                attachProjectId: filter.attachableTo.projectId,
                attachAgentId: filter.attachableTo.agentId,
            }),
        });
        if (filter.projectId) {
            query.andWhere(new typeorm_1.Brackets((qb) => qb
                .where('skill.projectId = :projectId')
                .orWhere(`skill.agentId IN ${agentsOf('owner.projectId = :projectId')}`)), { projectId: filter.projectId });
        }
        if (filter.search) {
            query
                .innerJoin(skill_version_entity_1.SkillVersion, 'latest', 'latest.skillId = skill.id')
                .andWhere((qb) => {
                const highest = qb
                    .subQuery()
                    .select('MAX(later.version)')
                    .from(skill_version_entity_1.SkillVersion, 'later')
                    .where('later.skillId = skill.id')
                    .getQuery();
                return `latest.version = ${highest}`;
            })
                .andWhere(new typeorm_1.Brackets((qb) => qb
                .where(`LOWER(latest.name) LIKE :search ${db_1.LIKE_ESCAPE_CLAUSE}`)
                .orWhere(`LOWER(latest.description) LIKE :search ${db_1.LIKE_ESCAPE_CLAUSE}`)), { search: `%${(0, db_1.escapeLike)(filter.search.toLowerCase())}%` });
        }
        query.orderBy('skill.updatedAt', 'DESC').addOrderBy('skill.id', 'ASC').offset(filter.skip);
        if (filter.take !== undefined)
            query.limit(filter.take);
        const [skills, count] = await query.getManyAndCount();
        return { skills, count };
    }
    async findByIds(ids, ctx = {}) {
        const manager = this.managerFor(ctx);
        return await inChunks(ids, async (chunk) => await manager.find(skill_entity_1.Skill, { where: { id: (0, typeorm_1.In)(chunk) } }));
    }
    async findLatestSaved(skillIds, ctx = {}) {
        const manager = this.managerFor(ctx);
        const versions = await inChunks(skillIds, async (chunk) => await latestVersionsQuery(manager, chunk).getMany());
        return await this.resolveBySkill(versions, ctx);
    }
    async findLatestSummaries(skillIds, ctx = {}) {
        const manager = this.managerFor(ctx);
        const versions = await inChunks(skillIds, async (chunk) => await latestVersionsQuery(manager, chunk)
            .select(['version.skillId', 'version.name', 'version.description', 'version.version'])
            .getMany());
        return new Map(versions.map((v) => [
            v.skillId,
            { name: v.name, description: v.description, version: v.version },
        ]));
    }
    async findLatestNamesInTarget(target, ctx = {}) {
        const query = highestVersionsQuery(this.managerFor(ctx))
            .innerJoin(skill_entity_1.Skill, 'skill', 'skill.id = version.skillId')
            .select(['version.skillId', 'version.name']);
        if (target.agentId) {
            query.andWhere('skill.agentId = :agentId', { agentId: target.agentId });
        }
        else if (target.projectId) {
            query
                .andWhere('skill.projectId = :projectId', { projectId: target.projectId })
                .andWhere('skill.agentId IS NULL');
        }
        else {
            query.andWhere('skill.projectId IS NULL').andWhere('skill.agentId IS NULL');
        }
        const versions = await query.getMany();
        return versions.map(({ skillId, name }) => ({ skillId, name }));
    }
    async findVersionsByIds(versionIds, ctx = {}) {
        if (versionIds.length === 0)
            return new Map();
        const versions = await this.managerFor(ctx).find(skill_version_entity_1.SkillVersion, {
            where: { id: (0, typeorm_1.In)(unique(versionIds)) },
        });
        const rows = await this.resolve(versions, ctx);
        return new Map(rows.map((row) => [row.version.id, row]));
    }
    async findPinned(agentVersionId, ctx = {}) {
        const pins = await this.managerFor(ctx).find(agent_version_skill_dependency_entity_1.AgentVersionSkillDependency, {
            where: { agentVersionId },
            order: { createdAt: 'ASC' },
        });
        const versions = await this.findVersionsByIds(pins.map((pin) => pin.skillVersionId), ctx);
        const result = new Map();
        for (const pin of pins) {
            const row = versions.get(pin.skillVersionId);
            if (row)
                result.set(pin.skillId, row);
        }
        return result;
    }
    async findPinnedSkillIds(agentVersionId, ctx = {}) {
        const pins = await this.managerFor(ctx).find(agent_version_skill_dependency_entity_1.AgentVersionSkillDependency, {
            select: ['skillId'],
            where: { agentVersionId },
            order: { createdAt: 'ASC' },
        });
        return pins.map((pin) => pin.skillId);
    }
    async nextVersionNumber(skillId, ctx = {}) {
        const latest = await this.managerFor(ctx).findOne(skill_version_entity_1.SkillVersion, {
            select: ['version'],
            where: { skillId },
            order: { version: 'DESC' },
        });
        return (latest?.version ?? 0) + 1;
    }
    async createSkill(skill, content, ctx = {}) {
        return await this.runInTransaction(ctx, async (manager) => {
            await manager.insert(skill_entity_1.Skill, {
                id: skill.id,
                projectId: skill.target.projectId,
                agentId: skill.target.agentId,
                source: skill.source,
                createdById: skill.createdById,
            });
            return await insertVersion(manager, skill.id, 1, content, skill.createdById);
        });
    }
    async insertSavedVersion(skillId, version, content, createdById, ctx = {}) {
        return await this.runInTransaction(ctx, async (manager) => {
            const id = await insertVersion(manager, skillId, version, content, createdById);
            await manager.update(skill_entity_1.Skill, { id: skillId }, { updatedAt: new Date() });
            return id;
        });
    }
    async insertPins(pins, ctx = {}) {
        if (pins.length === 0)
            return;
        const first = Date.now();
        await this.managerFor(ctx).insert(agent_version_skill_dependency_entity_1.AgentVersionSkillDependency, pins.map((pin, index) => ({ ...pin, createdAt: new Date(first + index) })));
    }
    async replaceDependencies(agentId, refs, ctx = {}) {
        const pinBySkill = new Map();
        for (const ref of refs) {
            if (pinBySkill.get(ref.skillId) === null)
                continue;
            pinBySkill.set(ref.skillId, ref.versionId ?? null);
        }
        await this.runInTransaction(ctx, async (manager, txCtx) => {
            const known = new Set((await this.findByIds([...pinBySkill.keys()], txCtx)).map((skill) => skill.id));
            const current = await manager.find(agent_skill_dependency_entity_1.AgentSkillDependency, { where: { agentId } });
            const removed = current.filter((row) => !known.has(row.skillId) || !pinBySkill.has(row.skillId));
            if (removed.length > 0) {
                await manager.delete(agent_skill_dependency_entity_1.AgentSkillDependency, {
                    agentId,
                    skillId: (0, typeorm_1.In)(removed.map((row) => row.skillId)),
                });
            }
            const kept = new Map(current.map((row) => [row.skillId, row]));
            for (const [skillId, skillVersionId] of pinBySkill) {
                const row = kept.get(skillId);
                if (row && row.skillVersionId !== skillVersionId) {
                    await manager.update(agent_skill_dependency_entity_1.AgentSkillDependency, { agentId, skillId }, { skillVersionId });
                }
            }
            const added = [...pinBySkill].filter(([skillId]) => known.has(skillId) && !kept.has(skillId));
            if (added.length === 0)
                return;
            const newest = Math.max(Date.now(), ...current.map((row) => row.createdAt.getTime() + 1));
            await manager.insert(agent_skill_dependency_entity_1.AgentSkillDependency, added.map(([skillId, skillVersionId], index) => ({
                agentId,
                skillId,
                skillVersionId,
                createdAt: new Date(newest + index),
            })));
        });
    }
    async findFollowingAgents(skillId, ctx = {}) {
        const agentIds = await this.findFollowingAgentIds([skillId], ctx);
        if (agentIds.length === 0)
            return [];
        return await this.managerFor(ctx).find(agent_entity_1.Agent, {
            where: { id: (0, typeorm_1.In)(agentIds) },
            select: ['id', 'name'],
        });
    }
    async findDependencies(agentIds, ctx = {}) {
        if (agentIds.length === 0)
            return new Map();
        const rows = await this.managerFor(ctx).find(agent_skill_dependency_entity_1.AgentSkillDependency, {
            where: { agentId: (0, typeorm_1.In)(unique(agentIds)) },
            order: { createdAt: 'ASC' },
        });
        const result = new Map();
        for (const row of rows) {
            const refs = result.get(row.agentId) ?? [];
            refs.push({ skillId: row.skillId, versionId: row.skillVersionId });
            result.set(row.agentId, refs);
        }
        return result;
    }
    async findFollowingAgentIds(skillIds, ctx = {}) {
        if (skillIds.length === 0)
            return [];
        const rows = await this.managerFor(ctx).find(agent_skill_dependency_entity_1.AgentSkillDependency, {
            where: { skillId: (0, typeorm_1.In)(unique(skillIds)), skillVersionId: (0, typeorm_1.IsNull)() },
        });
        return unique(rows.map((row) => row.agentId));
    }
    async findUsage(skillId, projectIds = 'all', ctx = {}) {
        const manager = this.managerFor(ctx);
        const drafted = await manager
            .createQueryBuilder(agent_entity_1.Agent, 'agent')
            .innerJoin(agent_skill_dependency_entity_1.AgentSkillDependency, 'dep', 'dep.agentId = agent.id')
            .where('dep.skillId = :skillId', { skillId })
            .select(['agent.id', 'agent.name', 'agent.projectId'])
            .getMany()
            .then((agents) => agents.filter(agent_entity_1.isProjectAgent));
        const published = await manager
            .createQueryBuilder(agent_entity_1.Agent, 'agent')
            .where((qb) => {
            const pinned = qb
                .subQuery()
                .select('history.agentId')
                .from(agent_history_entity_1.AgentHistory, 'history')
                .innerJoin(agent_version_skill_dependency_entity_1.AgentVersionSkillDependency, 'pin', 'pin.agentVersionId = history.versionId')
                .where('pin.skillId = :skillId')
                .getQuery();
            return `agent.id IN ${pinned}`;
        })
            .setParameter('skillId', skillId)
            .select(['agent.id', 'agent.name', 'agent.projectId', 'agent.activeVersionId'])
            .getMany()
            .then((agents) => agents.filter(agent_entity_1.isProjectAgent));
        const isVisible = (agent) => projectIds === 'all' || projectIds.includes(agent.projectId);
        const hidden = new Set([...drafted, ...published].filter((agent) => !isVisible(agent)).map((agent) => agent.id));
        const visiblePublished = published.filter(isVisible);
        const activeVersions = await this.findActivePinVersions(skillId, visiblePublished.flatMap((agent) => (agent.activeVersionId ? [agent.activeVersionId] : [])), manager);
        return {
            drafts: drafted.filter(isVisible).map((agent) => ({
                agentId: agent.id,
                agentName: agent.name,
                projectId: agent.projectId,
            })),
            pins: visiblePublished.map((agent) => ({
                agentId: agent.id,
                agentName: agent.name,
                projectId: agent.projectId,
                version: activeVersions.get(agent.activeVersionId ?? '') ?? null,
            })),
            hiddenAgents: hidden.size,
        };
    }
    async hasHubState(agentId, ctx = {}) {
        const manager = this.managerFor(ctx);
        if (await manager.exists(agent_skill_dependency_entity_1.AgentSkillDependency, { where: { agentId } }))
            return true;
        if (await manager.exists(skill_entity_1.Skill, { where: { agentId } }))
            return true;
        return await manager
            .createQueryBuilder(agent_version_skill_dependency_entity_1.AgentVersionSkillDependency, 'pin')
            .innerJoin(agent_history_entity_1.AgentHistory, 'history', 'history.versionId = pin.agentVersionId')
            .where('history.agentId = :agentId', { agentId })
            .getExists();
    }
    async findUnpinnedVersions(agentId, ctx = {}) {
        return await this.managerFor(ctx)
            .createQueryBuilder(agent_history_entity_1.AgentHistory, 'history')
            .select(['history.versionId', 'history.schema', 'history.skills'])
            .where('history.agentId = :agentId', { agentId })
            .andWhere((qb) => {
            const pinned = qb
                .subQuery()
                .select('1')
                .from(agent_version_skill_dependency_entity_1.AgentVersionSkillDependency, 'pin')
                .where('pin.agentVersionId = history.versionId')
                .getQuery();
            return `NOT EXISTS ${pinned}`;
        })
            .orderBy('history.createdAt', 'ASC')
            .addOrderBy('history.versionId', 'ASC')
            .getMany();
    }
    async findAgentSkillVersions(agentId, ctx = {}) {
        return await this.managerFor(ctx)
            .createQueryBuilder(skill_version_entity_1.SkillVersion, 'version')
            .innerJoin(skill_entity_1.Skill, 'skill', 'skill.id = version.skillId')
            .select(['version.id', 'version.skillId', 'version.version', 'version.contentHash'])
            .where('skill.agentId = :agentId', { agentId })
            .orWhere((qb) => {
            const refs = qb
                .subQuery()
                .select('dep.skillId')
                .from(agent_skill_dependency_entity_1.AgentSkillDependency, 'dep')
                .where('dep.agentId = :agentId')
                .getQuery();
            return `skill.id IN ${refs}`;
        })
            .orderBy('version.version', 'ASC')
            .getMany();
    }
    async findAgentIdsWithDraftRefs(ctx = {}) {
        const rows = await this.managerFor(ctx)
            .createQueryBuilder(agent_skill_dependency_entity_1.AgentSkillDependency, 'dep')
            .select('dep.agentId', 'agentId')
            .distinct(true)
            .orderBy('dep.agentId', 'ASC')
            .getRawMany();
        return rows.map((row) => row.agentId);
    }
    async findDraftContentHashes(agentIds, ctx = {}) {
        const manager = this.managerFor(ctx);
        const deps = await this.findDependencies(agentIds, ctx);
        const refs = [...deps.values()].flat();
        const pinnedIds = refs.flatMap((ref) => (ref.versionId ? [ref.versionId] : []));
        const followedIds = refs.flatMap((ref) => (ref.versionId ? [] : [ref.skillId]));
        const pinned = await inChunks(pinnedIds, async (chunk) => await manager.find(skill_version_entity_1.SkillVersion, {
            select: ['id', 'contentHash'],
            where: { id: (0, typeorm_1.In)(chunk) },
        }));
        const latest = await inChunks(followedIds, async (chunk) => await latestVersionsQuery(manager, chunk)
            .select(['version.skillId', 'version.contentHash'])
            .getMany());
        const hashByVersion = new Map(pinned.map((version) => [version.id, version.contentHash]));
        const hashBySkill = new Map(latest.map((version) => [version.skillId, version.contentHash]));
        const result = new Map();
        for (const [agentId, agentRefs] of deps) {
            result.set(agentId, agentRefs.flatMap((ref) => {
                const hash = ref.versionId
                    ? hashByVersion.get(ref.versionId)
                    : hashBySkill.get(ref.skillId);
                return hash ? [hash] : [];
            }));
        }
        return result;
    }
    async existsById(skillId, ctx = {}) {
        return await this.managerFor(ctx).exists(skill_entity_1.Skill, { where: { id: skillId } });
    }
    async findUsingAgentIds(skillId, ctx = {}) {
        const manager = this.managerFor(ctx);
        const drafts = await manager.find(agent_skill_dependency_entity_1.AgentSkillDependency, {
            select: ['agentId'],
            where: { skillId },
        });
        const pins = await manager
            .createQueryBuilder(agent_version_skill_dependency_entity_1.AgentVersionSkillDependency, 'pin')
            .innerJoin(agent_history_entity_1.AgentHistory, 'history', 'history.versionId = pin.agentVersionId')
            .where('pin.skillId = :skillId', { skillId })
            .select('history.agentId', 'agentId')
            .distinct(true)
            .getRawMany();
        return unique([...drafts, ...pins].map((row) => row.agentId));
    }
    async updateTarget(skillId, target, ctx = {}) {
        await this.managerFor(ctx).update(skill_entity_1.Skill, { id: skillId }, { projectId: target.projectId, agentId: target.agentId, updatedAt: new Date() });
    }
    async countUsingAgents(skillIds, ctx = {}) {
        const manager = this.managerFor(ctx);
        const pairs = await inChunks(skillIds, async (chunk) => {
            const drafts = await manager.find(agent_skill_dependency_entity_1.AgentSkillDependency, {
                select: ['skillId', 'agentId'],
                where: { skillId: (0, typeorm_1.In)(chunk) },
            });
            const pins = await manager
                .createQueryBuilder(agent_version_skill_dependency_entity_1.AgentVersionSkillDependency, 'pin')
                .innerJoin(agent_history_entity_1.AgentHistory, 'history', 'history.versionId = pin.agentVersionId')
                .where('pin.skillId IN (:...chunk)', { chunk })
                .select('pin.skillId', 'skillId')
                .addSelect('history.agentId', 'agentId')
                .distinct(true)
                .getRawMany();
            return [...drafts, ...pins];
        });
        const agentsBySkill = new Map();
        for (const { skillId, agentId } of pairs) {
            agentsBySkill.set(skillId, (agentsBySkill.get(skillId) ?? new Set()).add(agentId));
        }
        return new Map([...agentsBySkill].map(([skillId, agents]) => [skillId, agents.size]));
    }
    async findProjects(projectIds, ctx = {}) {
        const manager = this.managerFor(ctx);
        const projects = await inChunks(projectIds, async (chunk) => await manager.find(db_1.Project, {
            where: { id: (0, typeorm_1.In)(chunk) },
            select: ['id', 'name', 'type'],
        }));
        return new Map(projects.map((project) => [project.id, { name: project.name, type: project.type }]));
    }
    async findAgents(agentIds, ctx = {}) {
        const manager = this.managerFor(ctx);
        const agents = await inChunks(agentIds, async (chunk) => await manager.find(agent_entity_1.Agent, {
            where: { id: (0, typeorm_1.In)(chunk) },
            select: ['id', 'name', 'projectId'],
        }));
        return new Map(agents.filter(agent_entity_1.isProjectAgent).map(({ id, name, projectId }) => [id, { name, projectId }]));
    }
    async deleteSkill(skillId, ctx = {}) {
        await this.managerFor(ctx).delete(skill_entity_1.Skill, { id: skillId });
    }
    async lockForEdit(skillIds, ctx = {}) {
        await this.lock(skillIds, 'pessimistic_write', ctx);
    }
    async lockForPublish(skillIds, ctx = {}) {
        await this.lock(skillIds, 'pessimistic_read', ctx);
    }
    async lock(skillIds, mode, ctx) {
        if (!ctx.trx)
            throw new n8n_workflow_1.UnexpectedError('Skill row locks need a transaction');
        if (skillIds.length === 0 || this.manager.connection.options.type !== 'postgres')
            return;
        await this.managerFor(ctx).find(skill_entity_1.Skill, {
            select: ['id'],
            where: { id: (0, typeorm_1.In)(unique(skillIds)) },
            lock: { mode },
        });
    }
    async findActivePinVersions(skillId, agentVersionIds, manager) {
        const rows = await inChunks(agentVersionIds, async (chunk) => await manager
            .createQueryBuilder(agent_version_skill_dependency_entity_1.AgentVersionSkillDependency, 'pin')
            .innerJoin(skill_version_entity_1.SkillVersion, 'version', 'version.id = pin.skillVersionId')
            .where('pin.skillId = :skillId', { skillId })
            .andWhere('pin.agentVersionId IN (:...chunk)', { chunk })
            .select('pin.agentVersionId', 'agentVersionId')
            .addSelect('version.version', 'version')
            .getRawMany());
        return new Map(rows.map((row) => [row.agentVersionId, Number(row.version)]));
    }
    async resolveBySkill(versions, ctx) {
        const rows = await this.resolve(versions, ctx);
        return new Map(rows.map((row) => [row.skill.id, row]));
    }
    async resolve(versions, ctx) {
        if (versions.length === 0)
            return [];
        const manager = this.managerFor(ctx);
        const skills = await this.findByIds(versions.map((version) => version.skillId), ctx);
        const files = await inChunks(versions.map((version) => version.id), async (chunk) => await manager.find(skill_file_entity_1.SkillFile, { where: { skillVersionId: (0, typeorm_1.In)(chunk) } }));
        const skillById = new Map(skills.map((skill) => [skill.id, skill]));
        const filesByVersion = new Map();
        for (const file of files.sort((a, b) => (0, skill_content_hash_1.compareSkillFilePaths)(a.path, b.path))) {
            filesByVersion.set(file.skillVersionId, [
                ...(filesByVersion.get(file.skillVersionId) ?? []),
                file,
            ]);
        }
        return versions.flatMap((version) => {
            const skill = skillById.get(version.skillId);
            return skill ? [{ skill, version, files: filesByVersion.get(version.id) ?? [] }] : [];
        });
    }
};
exports.SkillRepository = SkillRepository;
exports.SkillRepository = SkillRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], SkillRepository);
function unique(values) {
    return [...new Set(values)];
}
async function inChunks(ids, read) {
    const results = [];
    for (const chunk of (0, db_1.chunkIds)(unique(ids)))
        results.push(...(await read(chunk)));
    return results;
}
function highestVersionsQuery(manager) {
    return manager.createQueryBuilder(skill_version_entity_1.SkillVersion, 'version').where((qb) => {
        const highest = qb
            .subQuery()
            .select('MAX(later.version)')
            .from(skill_version_entity_1.SkillVersion, 'later')
            .where('later.skillId = version.skillId')
            .getQuery();
        return `version.version = ${highest}`;
    });
}
function latestVersionsQuery(manager, skillIds) {
    return highestVersionsQuery(manager).andWhere('version.skillId IN (:...skillIds)', {
        skillIds,
    });
}
async function insertVersion(manager, skillId, version, content, createdById) {
    const id = (0, node_crypto_1.randomUUID)();
    await manager.save(manager.create(skill_version_entity_1.SkillVersion, {
        id,
        skillId,
        version,
        name: content.name,
        description: content.description,
        instructions: content.instructions,
        frontmatter: content.frontmatter,
        contentHash: (0, skill_content_hash_1.skillContentHash)(content),
        createdById,
    }));
    await insertFiles(manager, id, content.files);
    return id;
}
async function insertFiles(manager, skillVersionId, files) {
    if (files.length === 0)
        return;
    await manager.insert(skill_file_entity_1.SkillFile, files.map((file) => ({
        skillVersionId,
        path: file.path,
        content: file.content,
    })));
}
//# sourceMappingURL=skill.repository.js.map