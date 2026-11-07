"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSearchProjectsTool = void 0;
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
const schemas_1 = require("./schemas");
const tool_error_utils_1 = require("./tool-error.utils");
const MAX_RESULTS = 100;
const inputSchema = {
    query: zod_1.default
        .string()
        .optional()
        .describe('Filter projects by name (case-insensitive partial match). Pass the exact project name the user mentioned — results are ranked with exact case-insensitive matches first, then partial matches.'),
    type: zod_1.default
        .enum(['personal', 'team'])
        .optional()
        .describe("Filter by project type. 'team' for shared team projects, 'personal' for personal projects."),
    limit: (0, schemas_1.createLimitSchema)(MAX_RESULTS),
};
const outputSchema = {
    data: zod_1.default
        .array(zod_1.default.object({
        id: zod_1.default.string().describe('The unique identifier of the project'),
        name: zod_1.default.string().describe('The name of the project'),
        type: zod_1.default.enum(['personal', 'team']).describe("The project type: 'personal' or 'team'"),
        matchType: zod_1.default
            .enum(['exact', 'partial'])
            .optional()
            .describe("Whether this project's name matches the query exactly (case-insensitive) or only partially. Only present when a query was provided."),
    }))
        .describe('List of projects matching the query, sorted with exact case-insensitive matches first.'),
    count: zod_1.default.number().int().min(0).describe('Total number of matching projects'),
    teamProjectsEnabled: zod_1.default
        .boolean()
        .optional()
        .describe("Whether team projects are licensed on this n8n instance. When false, default to omitting projectId on create_workflow_from_code so the workflow lands in the caller's personal project, unless the user explicitly picked one of the returned accessible projects (legacy team projects can still appear here after a license downgrade). Omitted on error responses."),
    hint: zod_1.default
        .string()
        .optional()
        .describe('Guidance for picking a result. Present when the match is ambiguous — for example when no exact match was found but multiple partials were returned, or when team projects are not licensed on this instance. When present, follow it before calling create_workflow_from_code.'),
};
const createSearchProjectsTool = (user, projectRepository, licenseState, telemetry) => ({
    name: 'search_projects',
    config: {
        description: "Search for projects accessible to the current user. Call this whenever the user names a project — pass the name as the query, then use the resolved ID with tools that take a projectId. Results are ranked with exact case-insensitive name matches first. If no exact match is found but multiple partials are returned, the response includes a `hint` field telling you to clarify with the user before acting; follow it instead of guessing. The response also includes `teamProjectsEnabled` — when false, team projects are not licensed on this instance, so default to creating in the caller's personal project unless the user explicitly picks one of the returned accessible projects.",
        inputSchema,
        outputSchema,
        annotations: {
            title: 'Search Projects',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ query, type, limit = MAX_RESULTS, }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'search_projects',
            parameters: { query, type, limit },
        };
        const teamProjectsEnabled = licenseState.isTeamProjectsLicensed();
        try {
            const effectiveLimit = Math.min(Math.max(1, limit), MAX_RESULTS);
            const trimmedQuery = query?.trim();
            const [[partialProjects, count], exactProjects] = await Promise.all([
                projectRepository.getAccessibleProjectsAndCount(user.id, {
                    search: trimmedQuery,
                    type,
                    take: effectiveLimit,
                }),
                trimmedQuery
                    ? projectRepository.getAccessibleProjectsByExactName(user.id, trimmedQuery, type)
                    : Promise.resolve([]),
            ]);
            const partialIds = new Set(partialProjects.map((p) => p.id));
            const novelExactProjects = exactProjects.filter((p) => !partialIds.has(p.id));
            const mergedProjects = [...novelExactProjects, ...partialProjects];
            const normalizedQuery = trimmedQuery?.toLowerCase();
            const scoredProjects = mergedProjects.map((project) => ({
                project,
                isExact: normalizedQuery !== undefined && project.name.trim().toLowerCase() === normalizedQuery,
            }));
            if (normalizedQuery) {
                scoredProjects.sort((a, b) => {
                    if (a.isExact !== b.isExact)
                        return a.isExact ? -1 : 1;
                    return a.project.name.localeCompare(b.project.name);
                });
            }
            const limitedScored = scoredProjects.slice(0, effectiveLimit);
            const data = limitedScored.map(({ project, isExact }) => {
                const base = { id: project.id, name: project.name, type: project.type };
                if (!normalizedQuery)
                    return base;
                const matchType = isExact ? 'exact' : 'partial';
                return { ...base, matchType };
            });
            const exactMatchCount = scoredProjects.reduce((acc, p) => acc + (p.isExact ? 1 : 0), 0);
            const hints = [];
            if (normalizedQuery) {
                if (exactMatchCount === 0 && count > 1) {
                    hints.push(`No exact match for "${query}". ${count} partial matches are available — ask the user to clarify which project they meant before creating or updating a workflow.`);
                }
                else if (exactMatchCount > 1) {
                    hints.push(`Multiple projects are named "${query}". Ask the user to disambiguate (e.g. by team or owner) before creating or updating a workflow.`);
                }
            }
            if (!teamProjectsEnabled) {
                hints.push("Team projects are not enabled on this instance. New workflows should usually be created without a projectId so they land in the caller's personal project, unless the user explicitly selected one of the returned accessible projects.");
            }
            const hint = hints.length > 0 ? hints.join(' ') : undefined;
            telemetryPayload.results = {
                success: true,
                data: { count },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const output = { data, count, teamProjectsEnabled, ...(hint ? { hint } : {}) };
            return {
                content: [{ type: 'text', text: JSON.stringify(output) }],
                structuredContent: output,
            };
        }
        catch (error) {
            return (0, tool_error_utils_1.trackAndReturnToolError)(telemetry, telemetryPayload, error, (message) => ({
                data: [],
                count: 0,
                error: message,
            }));
        }
    },
});
exports.createSearchProjectsTool = createSearchProjectsTool;
//# sourceMappingURL=search-projects.tool.js.map