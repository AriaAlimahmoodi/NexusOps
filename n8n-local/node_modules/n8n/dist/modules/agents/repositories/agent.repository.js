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
exports.AgentRepository = void 0;
exports.hasN8nChatChannel = hasN8nChatChannel;
const api_types_1 = require("@n8n/api-types");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const typeorm_1 = require("@n8n/typeorm");
const node_crypto_1 = require("node:crypto");
const agent_entity_1 = require("../entities/agent.entity");
const projectScope = 'project';
const projectScopeSql = "agent.scope = 'project'";
const projectScopeUpdateSql = "scope = 'project'";
function hasN8nChatChannel(integrations) {
    return (integrations?.some((integration) => integration.type === api_types_1.N8N_CHAT_INTEGRATION_TYPE) ?? false);
}
let AgentRepository = class AgentRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(agent_entity_1.Agent, dataSource.manager, transactionRunner);
    }
    async insertNew(agent, ctx = {}) {
        await this.managerFor(ctx).insert(agent_entity_1.Agent, agent);
    }
    async hasRevision(id, revision) {
        return await this.existsBy({ id, revision });
    }
    async findByProjectId(projectId) {
        const agents = await this.find({
            where: { projectId, scope: projectScope },
            relations: { activeVersion: true },
            order: { updatedAt: 'DESC' },
        });
        return agents.filter(agent_entity_1.isProjectAgent);
    }
    async findForExport(agentIds, projectIds, options) {
        if (agentIds.length === 0 || projectIds?.length === 0)
            return [];
        const projectBatches = projectIds === null ? [null] : (0, db_1.chunkIds)([...new Set(projectIds)]);
        const agents = [];
        for (const ids of (0, db_1.chunkIds)([...new Set(agentIds)])) {
            for (const projects of projectBatches) {
                const found = await this.find({
                    where: {
                        id: (0, typeorm_1.In)(ids),
                        scope: 'project',
                        ...(projects === null ? {} : { projectId: (0, typeorm_1.In)(projects) }),
                    },
                    relations: { activeVersion: options.includeActiveVersion },
                });
                agents.push(...found.filter(agent_entity_1.isProjectAgent));
            }
        }
        return agents.sort((left, right) => left.id.localeCompare(right.id));
    }
    async findIdsInProjectsForExport(projectIds) {
        const ids = [];
        for (const projects of (0, db_1.chunkIds)([...new Set(projectIds)])) {
            const agents = await this.find({ select: ['id'], where: { projectId: (0, typeorm_1.In)(projects) } });
            ids.push(...agents.map(({ id }) => id));
        }
        return ids.sort();
    }
    async findExistingIds(agentIds) {
        const ids = new Set();
        for (const chunk of (0, db_1.chunkIds)(agentIds)) {
            const agents = await this.find({ select: ['id'], where: { id: (0, typeorm_1.In)(chunk) } });
            for (const { id } of agents)
                ids.add(id);
        }
        return ids;
    }
    async findSummariesByProjectIds(projectIds, options = {}) {
        if (projectIds?.length === 0)
            return [];
        const query = this.createQueryBuilder('agent')
            .select([
            'agent.id',
            'agent.name',
            'agent.projectId',
            'agent.activeVersionId',
            'agent.availableInMCP',
            'agent.updatedAt',
        ])
            .where(projectScopeSql)
            .orderBy('agent.updatedAt', 'DESC');
        if (projectIds !== null) {
            query.andWhere('agent.projectId IN (:...projectIds)', { projectIds });
        }
        if (options.query) {
            query.andWhere('LOWER(agent.name) LIKE LOWER(:query)', { query: `%${options.query}%` });
        }
        if (options.publishedOnly) {
            query.andWhere('agent.activeVersionId IS NOT NULL');
        }
        if (options.excludeAgentId) {
            query.andWhere('agent.id != :excludeAgentId', { excludeAgentId: options.excludeAgentId });
        }
        if (options.limit !== undefined) {
            query.take(options.limit);
        }
        return (await query.getMany()).filter(agent_entity_1.isProjectAgent);
    }
    async findByProjectIdsPaginated(projectIds, options, { withProject = false, usageCounts, } = {}) {
        if (projectIds?.length === 0)
            return { count: 0, data: [] };
        const query = this.createQueryBuilder('agent').leftJoinAndSelect('agent.activeVersion', 'activeVersion');
        if (withProject) {
            query.leftJoinAndSelect('agent.project', 'project');
        }
        query.where(projectScopeSql);
        if (projectIds !== null) {
            query.andWhere('agent.projectId IN (:...projectIds)', { projectIds });
        }
        this.applyFilters(query, options.filter);
        this.applySorting(query, options.sortBy, usageCounts);
        query.skip(options.skip).take(options.take);
        const [data, count] = await query.getManyAndCount();
        return { count, data: data.filter(agent_entity_1.isProjectAgent) };
    }
    async findN8nChatListPaginated(reachableProjectIds, ownedProjectIds, options, usageCounts) {
        if (reachableProjectIds?.length === 0 && ownedProjectIds.length === 0) {
            return { count: 0, data: [] };
        }
        const query = this.createQueryBuilder('agent')
            .leftJoinAndSelect('agent.activeVersion', 'activeVersion')
            .leftJoinAndSelect('agent.project', 'project')
            .where(projectScopeSql);
        const published = this.publishedN8nChatSql();
        const reachableOrOwned = [];
        if (reachableProjectIds === null)
            reachableOrOwned.push(published);
        else if (reachableProjectIds.length > 0) {
            reachableOrOwned.push(`(agent.projectId IN (:...reachableProjectIds) AND ${published})`);
        }
        if (ownedProjectIds.length > 0)
            reachableOrOwned.push('agent.projectId IN (:...ownedProjectIds)');
        query.andWhere(`(${reachableOrOwned.join(' OR ')})`, {
            reachableProjectIds,
            ownedProjectIds,
            n8nChatType: api_types_1.N8N_CHAT_INTEGRATION_TYPE,
        });
        this.applyFilters(query, {
            ...options.filter,
            availableInChat: options.filter?.availableInChat === false ? false : undefined,
        });
        this.applySorting(query, options.sortBy, usageCounts);
        query.skip(options.skip).take(options.take);
        const [data, count] = await query.getManyAndCount();
        return { count, data: data.filter(agent_entity_1.isProjectAgent) };
    }
    chatReachableQuery(query, projectIds) {
        query.andWhere(projectScopeSql);
        if (projectIds !== null) {
            query.andWhere('agent.projectId IN (:...projectIds)', { projectIds });
        }
        this.applyFilters(query, { availableInChat: true });
        return query;
    }
    async findChatReachableIds(projectIds) {
        if (projectIds?.length === 0)
            return [];
        const query = this.createQueryBuilder('agent')
            .leftJoin('agent.activeVersion', 'activeVersion')
            .select(['agent.id']);
        const rows = await this.chatReachableQuery(query, projectIds).getMany();
        return rows.map((row) => row.id);
    }
    async findChatReachableById(id, projectIds) {
        if (projectIds?.length === 0)
            return null;
        const query = this.createQueryBuilder('agent')
            .leftJoinAndSelect('agent.activeVersion', 'activeVersion')
            .leftJoinAndSelect('agent.project', 'project')
            .where('agent.id = :id', { id });
        return projectAgentOrNull(await this.chatReachableQuery(query, projectIds).getOne());
    }
    applyFilters(query, filter) {
        if (filter?.query) {
            query.andWhere('LOWER(agent.name) LIKE LOWER(:query)', { query: `%${filter.query}%` });
        }
        if (filter?.ids) {
            query.andWhere('agent.id IN (:...ids)', { ids: filter.ids });
        }
        if (filter?.availableInMCP !== undefined) {
            query.andWhere('agent.availableInMCP = :availableInMCP', {
                availableInMCP: filter.availableInMCP,
            });
        }
        if (filter?.availableInChat !== undefined) {
            const carriesChannel = this.publishedN8nChatSql();
            query.andWhere(filter.availableInChat ? carriesChannel : `NOT (${carriesChannel})`, {
                n8nChatType: api_types_1.N8N_CHAT_INTEGRATION_TYPE,
            });
        }
    }
    publishedN8nChatSql() {
        const isPostgres = this.manager.connection.options.type === 'postgres';
        const publishedChannels = isPostgres
            ? 'COALESCE("activeVersion"."schema"->\'integrations\', \'[]\'::json)'
            : 'COALESCE(json_extract("activeVersion"."schema", \'$.integrations\'), \'[]\')';
        return isPostgres
            ? `EXISTS (SELECT 1 FROM json_array_elements(${publishedChannels}) AS integration ` +
                "WHERE integration->>'type' = :n8nChatType)"
            : `EXISTS (SELECT 1 FROM json_each(${publishedChannels}) AS integration ` +
                "WHERE json_extract(integration.value, '$.type') = :n8nChatType)";
    }
    applySorting(query, sortBy, usageCounts) {
        const [field = 'updatedAt', direction = 'desc'] = sortBy?.split(':') ?? [];
        const sortDirection = direction.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
        if (field === 'name') {
            query
                .addSelect('LOWER(agent.name)', 'agent_name_lower')
                .orderBy('agent_name_lower', sortDirection);
            return;
        }
        if (field === 'usage') {
            this.applyUsageSorting(query, usageCounts);
            return;
        }
        query.orderBy(`agent.${field}`, sortDirection);
    }
    applyUsageSorting(query, usageCounts) {
        if (!usageCounts || usageCounts.size === 0) {
            query.orderBy('agent.createdAt', 'DESC').addOrderBy('agent.id', 'DESC');
            return;
        }
        const agentIds = [...usageCounts.keys()];
        const cases = agentIds.map((_, i) => `WHEN :usageAgent${i} THEN :usageCount${i}`).join(' ');
        agentIds.forEach((id, i) => {
            query.setParameter(`usageAgent${i}`, id).setParameter(`usageCount${i}`, usageCounts.get(id));
        });
        query
            .addSelect(`CASE agent.id ${cases} ELSE 0 END`, 'agent_usage_count')
            .orderBy('agent_usage_count', 'DESC')
            .addOrderBy('agent.createdAt', 'DESC')
            .addOrderBy('agent.id', 'DESC');
    }
    async findByIdAndProjectId(id, projectId) {
        return projectAgentOrNull(await this.findOne({
            where: { id, projectId, scope: projectScope },
            relations: { activeVersion: true },
        }));
    }
    async isN8nChatPublished(id, projectId) {
        const agent = await this.findByIdAndProjectId(id, projectId);
        return hasN8nChatChannel(agent?.activeVersion?.schema?.integrations);
    }
    async findById(id) {
        return projectAgentOrNull(await this.findOne({
            where: { id, scope: projectScope },
            relations: { activeVersion: true },
        }));
    }
    async ensureInstanceAgent(id, name) {
        await this.createQueryBuilder()
            .insert()
            .into(agent_entity_1.Agent)
            .values({ id, name, scope: 'instance', projectId: null, schema: null })
            .orIgnore()
            .execute();
        const existing = await this.findOneOrFail({ select: ['id', 'name', 'scope'], where: { id } });
        if (existing.scope !== 'instance') {
            throw new n8n_workflow_1.UnexpectedError(`Agent "${id}" exists as a project agent`);
        }
        if (existing.name !== name) {
            await this.update({ id, scope: 'instance' }, { name });
        }
    }
    async findDependencyIndexAgentIdsBatch(afterId, batchSize) {
        const query = this.createQueryBuilder('agent')
            .select(['agent.id'])
            .where(projectScopeSql)
            .orderBy('agent.id', 'ASC')
            .take(batchSize);
        if (afterId !== null) {
            query.andWhere('agent.id > :afterId', { afterId });
        }
        return await query.getMany();
    }
    async findSummariesByIds(ids) {
        if (ids.length === 0)
            return [];
        const agents = await this.find({
            select: ['id', 'name', 'projectId'],
            where: { id: (0, typeorm_1.In)(ids), scope: projectScope },
        });
        return agents.filter(agent_entity_1.isProjectAgent);
    }
    async findByIdInProjects(id, projectIds) {
        if (projectIds.length === 0)
            return null;
        return projectAgentOrNull(await this.findOne({
            where: { id, projectId: (0, typeorm_1.In)(projectIds), scope: projectScope },
            relations: { activeVersion: true },
        }));
    }
    async existsByIdAndProjectId(id, projectId) {
        return await this.exists({ where: { id, projectId, scope: projectScope } });
    }
    async getProjectIdById(id) {
        const result = await this.findOne({
            select: ['projectId'],
            where: { id, scope: projectScope },
        });
        return result?.projectId ?? null;
    }
    async findBudgetAlertTarget(id) {
        const agent = await this.findOne({
            select: ['name', 'projectId'],
            where: { id, scope: projectScope },
        });
        if (!agent || !(0, agent_entity_1.isProjectAgent)(agent))
            return null;
        return { name: agent.name, projectId: agent.projectId };
    }
    async findByIdsAndProjectId(ids, projectId) {
        if (ids.length === 0)
            return [];
        return await this.find({
            select: ['id', 'name', 'activeVersionId'],
            where: { id: (0, typeorm_1.In)(ids), projectId, scope: projectScope },
        });
    }
    async findMcpAvailabilityCandidates(where) {
        if ('ids' in where && where.ids.length === 0)
            return [];
        if ('projectIds' in where && where.projectIds.length === 0)
            return [];
        const criteria = 'ids' in where
            ? { id: (0, typeorm_1.In)(where.ids), scope: projectScope }
            : 'projectIds' in where
                ? { projectId: (0, typeorm_1.In)(where.projectIds), scope: projectScope }
                : { scope: projectScope };
        const agents = await this.find({
            select: ['id', 'projectId', 'availableInMCP'],
            where: criteria,
        });
        return agents.filter(agent_entity_1.isProjectAgent);
    }
    async setAvailableInMCP(agentIds, availableInMCP) {
        if (agentIds.length === 0)
            return;
        await this.update({ id: (0, typeorm_1.In)(agentIds), scope: projectScope }, { availableInMCP });
    }
    async claimSetupCompleted(id, completedAt) {
        const result = await this.update({ id, scope: projectScope, setupCompletedAt: (0, typeorm_1.IsNull)() }, { setupCompletedAt: completedAt });
        return (result.affected ?? 0) > 0;
    }
    async findIntegrationState(id) {
        return await this.findOne({
            select: ['integrations', 'versionId', 'activeVersionId'],
            where: { id, scope: projectScope },
        });
    }
    async updateIntegrations(id, integrations, expected, versionId) {
        const result = await this.update({
            id,
            scope: projectScope,
            revision: expected.revision,
            versionId: expected.versionId ?? (0, typeorm_1.IsNull)(),
            activeVersionId: expected.activeVersionId ?? (0, typeorm_1.IsNull)(),
        }, { integrations, versionId, revision: () => 'revision + 1' });
        return (result.affected ?? 0) > 0;
    }
    async findPublished() {
        const agents = await this.createQueryBuilder('agent')
            .innerJoinAndSelect('agent.activeVersion', 'activeVersion')
            .where(projectScopeSql)
            .getMany();
        return agents.filter(agent_entity_1.isProjectAgent);
    }
    async findPublishedAgentIds() {
        const rows = await this.find({
            where: { activeVersionId: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()), scope: projectScope },
            select: ['id'],
        });
        return rows.map((row) => row.id);
    }
    async findActiveVersionId(agentId) {
        const row = await this.findOne({
            where: { id: agentId, scope: projectScope },
            select: ['id', 'activeVersionId'],
        });
        return row?.activeVersionId ?? null;
    }
    async findPublishedIds(agentIds) {
        if (agentIds.length === 0)
            return new Set();
        const rows = await this.find({
            where: { id: (0, typeorm_1.In)(agentIds), activeVersionId: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()), scope: projectScope },
            select: ['id'],
        });
        return new Set(rows.map((row) => row.id));
    }
    async findByIntegrationCredentialAnyProject(type, credentialId, excludeAgentId) {
        const agents = await this.find({
            select: ['id', 'name', 'integrations'],
            where: { scope: projectScope },
        });
        return agents.filter((agent) => agent.id !== excludeAgentId &&
            (agent.integrations ?? []).some((i) => i.type === type && i.credentialId === credentialId));
    }
    async findWithIntegrationType(type) {
        const agents = await this.createQueryBuilder('agent')
            .select(['agent.id', 'agent.integrations'])
            .where(`CAST(agent.integrations AS TEXT) LIKE :pattern ${db_1.LIKE_ESCAPE_CLAUSE}`, {
            pattern: `%${(0, db_1.escapeLike)(JSON.stringify(type))}%`,
        })
            .getMany();
        return agents.filter((agent) => (agent.integrations ?? []).some((i) => i.type === type));
    }
    async findByIntegrationCredential(type, credentialId, projectId, excludeAgentId) {
        const agents = await this.find({ where: { projectId, scope: projectScope } });
        return agents
            .filter(agent_entity_1.isProjectAgent)
            .filter((agent) => agent.id !== excludeAgentId &&
            (agent.integrations ?? []).some((i) => i.type === type && i.credentialId === credentialId));
    }
    async setActiveVersionFenced(id, expectedRevision, next, ctx = {}) {
        const result = await this.managerFor(ctx)
            .createQueryBuilder()
            .update(agent_entity_1.Agent)
            .set({
            activeVersionId: next.activeVersionId,
            versionId: next.versionId,
            revision: () => 'revision + 1',
        })
            .where('id = :id AND revision = :expected', { id, expected: expectedRevision })
            .andWhere(projectScopeUpdateSql)
            .execute();
        return (result.affected ?? 0) > 0;
    }
    async saveDraftFenced(agent, ctx = {}) {
        const expectedRevision = agent.revision;
        const updatedAt = new Date();
        const result = await this.managerFor(ctx)
            .createQueryBuilder()
            .update(agent_entity_1.Agent)
            .set({
            name: agent.name,
            schema: agent.schema,
            integrations: agent.integrations,
            tools: agent.tools,
            skills: agent.skills,
            versionId: agent.versionId,
            updatedAt,
            revision: () => 'revision + 1',
        })
            .where('id = :id AND revision = :expected', { id: agent.id, expected: expectedRevision })
            .andWhere(projectScopeUpdateSql)
            .execute();
        const won = (result.affected ?? 0) > 0;
        if (won) {
            agent.revision = expectedRevision + 1;
            agent.updatedAt = updatedAt;
        }
        return won;
    }
    async markDraftChangedIfInSync(agentIds, ctx = {}) {
        const changed = [];
        for (const id of agentIds) {
            const result = await this.managerFor(ctx)
                .createQueryBuilder()
                .update(agent_entity_1.Agent)
                .set({ versionId: (0, node_crypto_1.randomUUID)() })
                .where('id = :id', { id })
                .andWhere('"versionId" = "activeVersionId"')
                .andWhere(projectScopeUpdateSql)
                .execute();
            if ((result.affected ?? 0) > 0)
                changed.push(id);
        }
        return changed;
    }
    async findPageForSkillCopy(after, take, ctx = {}) {
        const query = this.managerFor(ctx)
            .createQueryBuilder(agent_entity_1.Agent, 'agent')
            .select(['agent.id', 'agent.createdAt'])
            .orderBy('agent.createdAt', 'ASC')
            .addOrderBy('agent.id', 'ASC')
            .limit(take);
        if (after) {
            query.where('(agent.createdAt > :createdAt OR (agent.createdAt = :createdAt AND agent.id > :id))', {
                createdAt: after.createdAt,
                id: after.id,
            });
        }
        return await query.getMany();
    }
    async findForSkillCopy(agentId, ctx = {}) {
        return await this.managerFor(ctx).findOne(agent_entity_1.Agent, {
            select: ['id', 'schema', 'skills'],
            where: { id: agentId },
        });
    }
    async lockForSkillCopy(agentId, ctx) {
        if (this.manager.connection.options.type !== 'postgres')
            return;
        await this.managerFor(ctx).find(agent_entity_1.Agent, {
            select: ['id'],
            where: { id: agentId },
            lock: { mode: 'pessimistic_write' },
        });
    }
    async findProjectIdsByIds(ids, ctx = {}) {
        const agents = [];
        for (const chunk of (0, db_1.chunkIds)([...new Set(ids)])) {
            agents.push(...(await this.managerFor(ctx).find(agent_entity_1.Agent, {
                where: { id: (0, typeorm_1.In)(chunk) },
                select: ['id', 'projectId'],
            })));
        }
        return agents.filter(agent_entity_1.isProjectAgent);
    }
    async updateDraftSkills(agent, ctx) {
        await this.managerFor(ctx)
            .createQueryBuilder()
            .update(agent_entity_1.Agent)
            .set({ schema: agent.schema, skills: agent.skills, updatedAt: agent.updatedAt })
            .where('id = :id', { id: agent.id })
            .andWhere(projectScopeUpdateSql)
            .execute();
    }
    async updateDraftSchema(agent, ctx) {
        await this.managerFor(ctx)
            .createQueryBuilder()
            .update(agent_entity_1.Agent)
            .set({ schema: agent.schema, updatedAt: agent.updatedAt })
            .where('id = :id', { id: agent.id })
            .andWhere(projectScopeUpdateSql)
            .execute();
    }
};
exports.AgentRepository = AgentRepository;
exports.AgentRepository = AgentRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], AgentRepository);
function projectAgentOrNull(agent) {
    return agent && (0, agent_entity_1.isProjectAgent)(agent) ? agent : null;
}
//# sourceMappingURL=agent.repository.js.map