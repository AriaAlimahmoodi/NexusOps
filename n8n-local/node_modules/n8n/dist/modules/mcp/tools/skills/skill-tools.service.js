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
exports.McpSkillToolsService = void 0;
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const zod_1 = require("zod");
const skill_name_taken_error_1 = require("../../../../modules/agents/skills/skill-name-taken.error");
const skills_api_service_1 = require("../../../../modules/agents/skills/skills-api.service");
const telemetry_1 = require("../../../../telemetry");
const mcp_constants_1 = require("../../mcp.constants");
const tool_error_utils_1 = require("../tool-error.utils");
const tool_result_utils_1 = require("../tool-result.utils");
const searchSkillsInput = {
    query: zod_1.z.string().trim().max(200).optional().describe('Filter by skill name or description'),
    scope: api_types_1.skillScopeSchema.optional().describe('Only skills of this scope'),
    projectId: zod_1.z.string().min(1).optional().describe('Only skills of this project'),
    attachableToAgentId: zod_1.z
        .string()
        .min(1)
        .optional()
        .describe('Only the skills this Agent may attach. Do not combine with scope or projectId'),
    limit: zod_1.z.number().int().min(1).max(api_types_1.SKILLS_MAX_PAGE_SIZE).optional().default(50),
    skip: zod_1.z.number().int().min(0).optional().default(0).describe('Skills to skip, for the next page'),
};
const skillIdInput = {
    skillId: zod_1.z.string().min(1).describe('The skill ID from search_skills'),
};
const createSkillInput = {
    scope: zod_1.z
        .enum(['project', 'instance'])
        .describe('project: one project can use the skill. instance: every project can use it'),
    projectId: zod_1.z.string().min(1).optional().describe('Required when scope is project'),
    skill: api_types_1.CreateSkillDto.schema.shape.skill,
};
const updateSkillInput = {
    ...skillIdInput,
    ...api_types_1.SaveSkillDto.schema.shape,
    baseSkillHash: api_types_1.SaveSkillDto.schema.shape.baseSkillHash.describe('skillHash from get_skill. The update is refused if the skill changed since'),
    scope: api_types_1.SaveSkillDto.schema.shape.scope.describe('Moves the skill. Refused while an Agent uses it'),
};
function summary(item) {
    return {
        id: item.id,
        name: item.name,
        description: item.description,
        scope: item.scope,
        projectId: item.projectId,
        projectName: item.projectName,
        agentId: item.agentId,
        agentName: item.agentName,
        latestVersion: item.latestVersion,
        usedByAgents: item.usedByAgents,
        canEdit: item.canEdit,
        canDelete: item.canDelete,
        updatedAt: item.updatedAt,
    };
}
function details(detail) {
    return {
        ...summary(detail),
        skill: detail.skill,
        skillHash: detail.skillHash,
        usedBy: detail.usedBy,
    };
}
let McpSkillToolsService = class McpSkillToolsService {
    constructor(telemetry, skillsApi) {
        this.telemetry = telemetry;
        this.skillsApi = skillsApi;
    }
    registerTools(registerTool, user) {
        registerTool({
            name: 'search_skills',
            config: {
                description: 'Search the skills hub. Skills are reusable instructions.',
                inputSchema: searchSkillsInput,
                annotations: {
                    title: 'Search Skills',
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: false,
                },
            },
            handler: async (input) => await this.run(user, 'search_skills', { scope: input.scope }, async () => {
                const { count, data } = await this.skillsApi.list(user, api_types_1.ListSkillsQueryDto.parse({
                    search: input.query,
                    scope: input.scope,
                    projectId: input.projectId,
                    attachableTo: input.attachableToAgentId,
                    skip: String(input.skip),
                    take: String(input.limit),
                }));
                return { count, skills: data.map(summary) };
            }),
        });
        registerTool({
            name: 'get_skill',
            config: {
                description: 'Read a skill with its instructions, references, skillHash and the Agents that use it.',
                inputSchema: skillIdInput,
                annotations: {
                    title: 'Get Skill',
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: false,
                },
            },
            handler: async ({ skillId }) => await this.run(user, 'get_skill', { skillId }, async () => details(await this.skillsApi.get(user, skillId))),
        });
        registerTool({
            name: 'create_skill',
            config: {
                description: 'Create a skill in the skills hub.',
                inputSchema: createSkillInput,
                annotations: {
                    title: 'Create Skill',
                    readOnlyHint: false,
                    destructiveHint: false,
                    idempotentHint: false,
                    openWorldHint: false,
                },
            },
            handler: async (input) => await this.run(user, 'create_skill', { scope: input.scope }, async () => {
                try {
                    const detail = await this.skillsApi.create(user, api_types_1.CreateSkillDto.parse({
                        scope: input.scope,
                        projectId: input.projectId,
                        skill: input.skill,
                    }), 'mcp');
                    return details(detail);
                }
                catch (error) {
                    if (!(error instanceof skill_name_taken_error_1.SkillNameTakenError))
                        throw error;
                    return {
                        ok: false,
                        code: 'skill_name_taken',
                        message: (0, skill_name_taken_error_1.skillNameTakenToolMessage)(error.skillName),
                    };
                }
            }),
        });
        registerTool({
            name: 'update_skill',
            config: {
                description: 'Update a skill. The update creates a new version of the skill. Pass only the fields to change.',
                inputSchema: updateSkillInput,
                annotations: {
                    title: 'Update Skill',
                    readOnlyHint: false,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: false,
                },
            },
            handler: async ({ skillId, ...update }) => await this.run(user, 'update_skill', { skillId, scope: update.scope }, async () => {
                try {
                    const { skill: _skill, ...saved } = await this.skillsApi.update(user, skillId, api_types_1.SaveSkillDto.parse(update), 'mcp');
                    return saved;
                }
                catch (error) {
                    if (error instanceof skill_name_taken_error_1.SkillNameTakenError) {
                        return {
                            ok: false,
                            code: 'skill_name_taken',
                            skillId,
                            message: (0, skill_name_taken_error_1.skillNameTakenToolMessage)(error.skillName),
                        };
                    }
                    if (!(error instanceof errors_1.ConflictError))
                        throw error;
                    const { skillHash } = await this.skillsApi.get(user, skillId);
                    if (skillHash === update.baseSkillHash)
                        throw error;
                    return {
                        ok: false,
                        code: 'stale_skill',
                        skillId,
                        skillHash,
                        message: 'The skill changed since you read it. Call get_skill before retrying.',
                    };
                }
            }),
        });
        registerTool({
            name: 'delete_skill',
            config: {
                description: 'Permanently delete a skill from the skills hub. Refused while an Agent uses it.',
                inputSchema: skillIdInput,
                annotations: {
                    title: 'Delete Skill',
                    readOnlyHint: false,
                    destructiveHint: true,
                    idempotentHint: true,
                    openWorldHint: false,
                },
            },
            handler: async ({ skillId }) => await this.run(user, 'delete_skill', { skillId }, async () => {
                await this.skillsApi.delete(user, skillId, 'mcp');
                return { deleted: true, skillId };
            }),
        });
    }
    async run(user, toolName, parameters, action) {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: toolName,
            parameters,
        };
        try {
            const data = await action();
            telemetryPayload.results = { success: data.ok !== false };
            this.telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return (0, tool_result_utils_1.toolResult)(data, data.ok === false);
        }
        catch (error) {
            return (0, tool_error_utils_1.trackAndReturnToolError)(this.telemetry, telemetryPayload, error, (message) => ({
                ok: false,
                code: 'skill_tool_error',
                error: message,
            }));
        }
    }
};
exports.McpSkillToolsService = McpSkillToolsService;
exports.McpSkillToolsService = McpSkillToolsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [telemetry_1.Telemetry, skills_api_service_1.SkillsApiService])
], McpSkillToolsService);
//# sourceMappingURL=skill-tools.service.js.map