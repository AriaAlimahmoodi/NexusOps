import { Tool } from '@n8n/agents/tool';
import type { AgentKnowledgeMirrorService } from '../../agent-knowledge-mirror.service';
export declare function createKnowledgeRetrievalTools({ projectId, agentId, knowledgeMirrorService, }: {
    projectId: string;
    agentId: string;
    knowledgeMirrorService: AgentKnowledgeMirrorService;
}): (Tool<import("zod").ZodEffects<import("zod").ZodObject<{
    pattern: import("zod").ZodString;
    limit: import("zod").ZodOptional<import("zod").ZodNumber>;
    offset: import("zod").ZodOptional<import("zod").ZodNumber>;
    caseSensitive: import("zod").ZodOptional<import("zod").ZodBoolean>;
}, "strict", import("zod").ZodTypeAny, {
    pattern: string;
    limit?: number | undefined;
    offset?: number | undefined;
    caseSensitive?: boolean | undefined;
}, {
    pattern: string;
    limit?: number | undefined;
    offset?: number | undefined;
    caseSensitive?: boolean | undefined;
}>, {
    pattern: string;
    limit?: number | undefined;
    offset?: number | undefined;
    caseSensitive?: boolean | undefined;
}, {
    pattern: string;
    limit?: number | undefined;
    offset?: number | undefined;
    caseSensitive?: boolean | undefined;
}>, import("zod").ZodTypeAny, undefined, undefined> | Tool<import("zod").ZodEffects<import("zod").ZodObject<{
    file: import("zod").ZodOptional<import("zod").ZodString>;
    fileId: import("zod").ZodOptional<import("zod").ZodString>;
    ranges: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
        startLine: import("zod").ZodNumber;
        endLine: import("zod").ZodNumber;
    }, "strict", import("zod").ZodTypeAny, {
        startLine: number;
        endLine: number;
    }, {
        startLine: number;
        endLine: number;
    }>, "many">>;
}, "strict", import("zod").ZodTypeAny, {
    file?: string | undefined;
    fileId?: string | undefined;
    ranges?: {
        startLine: number;
        endLine: number;
    }[] | undefined;
}, {
    file?: string | undefined;
    fileId?: string | undefined;
    ranges?: {
        startLine: number;
        endLine: number;
    }[] | undefined;
}>, {
    file?: string | undefined;
    fileId?: string | undefined;
    ranges?: {
        startLine: number;
        endLine: number;
    }[] | undefined;
}, {
    file?: string | undefined;
    fileId?: string | undefined;
    ranges?: {
        startLine: number;
        endLine: number;
    }[] | undefined;
}>, import("zod").ZodTypeAny, undefined, undefined> | Tool<import("zod").ZodObject<{
    pattern: import("zod").ZodString;
    path: import("zod").ZodEffects<import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>, string[] | undefined, unknown>;
    output_mode: import("zod").ZodOptional<import("zod").ZodEnum<["content", "files_with_matches", "count"]>>;
    head_limit: import("zod").ZodOptional<import("zod").ZodNumber>;
    '-C': import("zod").ZodOptional<import("zod").ZodNumber>;
    '-i': import("zod").ZodOptional<import("zod").ZodBoolean>;
}, "strict", import("zod").ZodTypeAny, {
    pattern: string;
    path?: string[] | undefined;
    output_mode?: "content" | "count" | "files_with_matches" | undefined;
    head_limit?: number | undefined;
    '-C'?: number | undefined;
    '-i'?: boolean | undefined;
}, {
    pattern: string;
    path?: unknown;
    output_mode?: "content" | "count" | "files_with_matches" | undefined;
    head_limit?: number | undefined;
    '-C'?: number | undefined;
    '-i'?: boolean | undefined;
}>, import("zod").ZodTypeAny, undefined, undefined>)[];
