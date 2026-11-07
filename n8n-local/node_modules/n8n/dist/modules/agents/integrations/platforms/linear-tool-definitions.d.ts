import { z } from 'zod';
export declare const LINEAR_CONTEXT_QUERY_TOOL_DEFINITIONS: ({
    name: "get_team";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"get_team">;
        input: z.ZodObject<{
            teamId: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            teamId: string;
        }, {
            teamId: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        query: "get_team";
        input: {
            teamId: string;
        };
    }, {
        query: "get_team";
        input: {
            teamId: string;
        };
    }>;
    description: string;
} | {
    name: "search_teams";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"search_teams">;
        input: z.ZodObject<{
            query: z.ZodOptional<z.ZodString>;
            limit: z.ZodOptional<z.ZodNumber>;
            cursor: z.ZodOptional<z.ZodString>;
            includeArchived: z.ZodOptional<z.ZodBoolean>;
        }, "strict", z.ZodTypeAny, {
            query?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeArchived?: boolean | undefined;
        }, {
            query?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeArchived?: boolean | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        query: "search_teams";
        input: {
            query?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeArchived?: boolean | undefined;
        };
    }, {
        query: "search_teams";
        input: {
            query?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeArchived?: boolean | undefined;
        };
    }>;
    description: string;
} | {
    name: "get_project";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"get_project">;
        input: z.ZodObject<{
            projectId: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            projectId: string;
        }, {
            projectId: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        query: "get_project";
        input: {
            projectId: string;
        };
    }, {
        query: "get_project";
        input: {
            projectId: string;
        };
    }>;
    description: string;
} | {
    name: "search_projects";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"search_projects">;
        input: z.ZodObject<{
            query: z.ZodOptional<z.ZodString>;
            limit: z.ZodOptional<z.ZodNumber>;
            cursor: z.ZodOptional<z.ZodString>;
            teamId: z.ZodOptional<z.ZodString>;
            includeArchived: z.ZodOptional<z.ZodBoolean>;
        }, "strict", z.ZodTypeAny, {
            query?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            teamId?: string | undefined;
            includeArchived?: boolean | undefined;
        }, {
            query?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            teamId?: string | undefined;
            includeArchived?: boolean | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        query: "search_projects";
        input: {
            query?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            teamId?: string | undefined;
            includeArchived?: boolean | undefined;
        };
    }, {
        query: "search_projects";
        input: {
            query?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            teamId?: string | undefined;
            includeArchived?: boolean | undefined;
        };
    }>;
    description: string;
} | {
    name: "search_labels";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"search_labels">;
        input: z.ZodObject<{
            query: z.ZodOptional<z.ZodString>;
            limit: z.ZodOptional<z.ZodNumber>;
            cursor: z.ZodOptional<z.ZodString>;
            teamId: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            query?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            teamId?: string | undefined;
        }, {
            query?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            teamId?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        query: "search_labels";
        input: {
            query?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            teamId?: string | undefined;
        };
    }, {
        query: "search_labels";
        input: {
            query?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            teamId?: string | undefined;
        };
    }>;
    description: string;
} | {
    name: "search_issue_states";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"search_issue_states">;
        input: z.ZodObject<{
            query: z.ZodOptional<z.ZodString>;
            limit: z.ZodOptional<z.ZodNumber>;
            cursor: z.ZodOptional<z.ZodString>;
            teamId: z.ZodOptional<z.ZodString>;
            type: z.ZodOptional<z.ZodEnum<["backlog", "unstarted", "started", "completed", "canceled"]>>;
        }, "strict", z.ZodTypeAny, {
            query?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            teamId?: string | undefined;
            type?: "backlog" | "canceled" | "completed" | "started" | "unstarted" | undefined;
        }, {
            query?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            teamId?: string | undefined;
            type?: "backlog" | "canceled" | "completed" | "started" | "unstarted" | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        query: "search_issue_states";
        input: {
            query?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            teamId?: string | undefined;
            type?: "backlog" | "canceled" | "completed" | "started" | "unstarted" | undefined;
        };
    }, {
        query: "search_issue_states";
        input: {
            query?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            teamId?: string | undefined;
            type?: "backlog" | "canceled" | "completed" | "started" | "unstarted" | undefined;
        };
    }>;
    description: string;
} | {
    name: "get_issue";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"get_issue">;
        input: z.ZodObject<{
            issueId: z.ZodString;
            includeComments: z.ZodOptional<z.ZodBoolean>;
            commentsLimit: z.ZodOptional<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
            issueId: string;
            includeComments?: boolean | undefined;
            commentsLimit?: number | undefined;
        }, {
            issueId: string;
            includeComments?: boolean | undefined;
            commentsLimit?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        query: "get_issue";
        input: {
            issueId: string;
            includeComments?: boolean | undefined;
            commentsLimit?: number | undefined;
        };
    }, {
        query: "get_issue";
        input: {
            issueId: string;
            includeComments?: boolean | undefined;
            commentsLimit?: number | undefined;
        };
    }>;
    description: string;
} | {
    name: "search_issues";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"search_issues">;
        input: z.ZodObject<{
            query: z.ZodString;
            limit: z.ZodOptional<z.ZodNumber>;
            cursor: z.ZodOptional<z.ZodString>;
            teamId: z.ZodOptional<z.ZodString>;
            includeArchived: z.ZodOptional<z.ZodBoolean>;
        }, "strict", z.ZodTypeAny, {
            query: string;
            limit?: number | undefined;
            cursor?: string | undefined;
            teamId?: string | undefined;
            includeArchived?: boolean | undefined;
        }, {
            query: string;
            limit?: number | undefined;
            cursor?: string | undefined;
            teamId?: string | undefined;
            includeArchived?: boolean | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        query: "search_issues";
        input: {
            query: string;
            limit?: number | undefined;
            cursor?: string | undefined;
            teamId?: string | undefined;
            includeArchived?: boolean | undefined;
        };
    }, {
        query: "search_issues";
        input: {
            query: string;
            limit?: number | undefined;
            cursor?: string | undefined;
            teamId?: string | undefined;
            includeArchived?: boolean | undefined;
        };
    }>;
    description: string;
})[];
export declare const LINEAR_ACTION_TOOL_DEFINITIONS: ({
    name: "create_issue";
    inputSchema: z.ZodObject<{
        action: z.ZodLiteral<"create_issue">;
        input: z.ZodObject<{
            teamId: z.ZodString;
            title: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            assigneeId: z.ZodOptional<z.ZodString>;
            projectId: z.ZodOptional<z.ZodString>;
            labelIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            priority: z.ZodOptional<z.ZodNumber>;
            stateId: z.ZodOptional<z.ZodString>;
            parentId: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            teamId: string;
            title: string;
            description?: string | undefined;
            assigneeId?: string | undefined;
            projectId?: string | undefined;
            labelIds?: string[] | undefined;
            priority?: number | undefined;
            stateId?: string | undefined;
            parentId?: string | undefined;
        }, {
            teamId: string;
            title: string;
            description?: string | undefined;
            assigneeId?: string | undefined;
            projectId?: string | undefined;
            labelIds?: string[] | undefined;
            priority?: number | undefined;
            stateId?: string | undefined;
            parentId?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        action: "create_issue";
        input: {
            teamId: string;
            title: string;
            description?: string | undefined;
            assigneeId?: string | undefined;
            projectId?: string | undefined;
            labelIds?: string[] | undefined;
            priority?: number | undefined;
            stateId?: string | undefined;
            parentId?: string | undefined;
        };
    }, {
        action: "create_issue";
        input: {
            teamId: string;
            title: string;
            description?: string | undefined;
            assigneeId?: string | undefined;
            projectId?: string | undefined;
            labelIds?: string[] | undefined;
            priority?: number | undefined;
            stateId?: string | undefined;
            parentId?: string | undefined;
        };
    }>;
    sensitive: true;
    description: string;
} | {
    name: "update_issue";
    inputSchema: z.ZodObject<{
        action: z.ZodLiteral<"update_issue">;
        input: z.ZodEffects<z.ZodObject<{
            issueId: z.ZodString;
            teamId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            title: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            assigneeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            projectId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            labelIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            priority: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stateId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strict", z.ZodTypeAny, {
            issueId: string;
            teamId?: string | null | undefined;
            title?: string | undefined;
            description?: string | null | undefined;
            assigneeId?: string | null | undefined;
            projectId?: string | null | undefined;
            labelIds?: string[] | undefined;
            priority?: number | null | undefined;
            stateId?: string | null | undefined;
            parentId?: string | null | undefined;
        }, {
            issueId: string;
            teamId?: string | null | undefined;
            title?: string | undefined;
            description?: string | null | undefined;
            assigneeId?: string | null | undefined;
            projectId?: string | null | undefined;
            labelIds?: string[] | undefined;
            priority?: number | null | undefined;
            stateId?: string | null | undefined;
            parentId?: string | null | undefined;
        }>, {
            issueId: string;
            teamId?: string | null | undefined;
            title?: string | undefined;
            description?: string | null | undefined;
            assigneeId?: string | null | undefined;
            projectId?: string | null | undefined;
            labelIds?: string[] | undefined;
            priority?: number | null | undefined;
            stateId?: string | null | undefined;
            parentId?: string | null | undefined;
        }, {
            issueId: string;
            teamId?: string | null | undefined;
            title?: string | undefined;
            description?: string | null | undefined;
            assigneeId?: string | null | undefined;
            projectId?: string | null | undefined;
            labelIds?: string[] | undefined;
            priority?: number | null | undefined;
            stateId?: string | null | undefined;
            parentId?: string | null | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        action: "update_issue";
        input: {
            issueId: string;
            teamId?: string | null | undefined;
            title?: string | undefined;
            description?: string | null | undefined;
            assigneeId?: string | null | undefined;
            projectId?: string | null | undefined;
            labelIds?: string[] | undefined;
            priority?: number | null | undefined;
            stateId?: string | null | undefined;
            parentId?: string | null | undefined;
        };
    }, {
        action: "update_issue";
        input: {
            issueId: string;
            teamId?: string | null | undefined;
            title?: string | undefined;
            description?: string | null | undefined;
            assigneeId?: string | null | undefined;
            projectId?: string | null | undefined;
            labelIds?: string[] | undefined;
            priority?: number | null | undefined;
            stateId?: string | null | undefined;
            parentId?: string | null | undefined;
        };
    }>;
    sensitive: true;
    description: string;
} | {
    name: "create_comment";
    inputSchema: z.ZodObject<{
        action: z.ZodLiteral<"create_comment">;
        input: z.ZodObject<{
            issueId: z.ZodString;
            body: z.ZodString;
            parentCommentId: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            issueId: string;
            body: string;
            parentCommentId?: string | undefined;
        }, {
            issueId: string;
            body: string;
            parentCommentId?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        action: "create_comment";
        input: {
            issueId: string;
            body: string;
            parentCommentId?: string | undefined;
        };
    }, {
        action: "create_comment";
        input: {
            issueId: string;
            body: string;
            parentCommentId?: string | undefined;
        };
    }>;
    sensitive: true;
    description: string;
})[];
