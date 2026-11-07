import type { ExecutionDataStorageLocation } from '@n8n/db';
import { z } from 'zod';
export declare const DEFAULT_SEARCH_TEXT_LIMIT = 20;
export declare const DEFAULT_GLOB_FILES_LIMIT = 20;
export declare const MAX_SEARCH_LINE_CHARS = 500;
export declare const MAX_READ_LINE_CHARS = 2000;
export declare const MAX_OPERATION_OUTPUT_CHARS = 20000;
export declare const MAX_SEARCH_CONTEXT_LINES = 10;
export declare const MAX_READ_RANGES = 10;
export declare const searchKnowledgeInputSchema: z.ZodObject<{
    pattern: z.ZodString;
    path: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodString, "many">>, string[] | undefined, unknown>;
    output_mode: z.ZodOptional<z.ZodEnum<["content", "files_with_matches", "count"]>>;
    head_limit: z.ZodOptional<z.ZodNumber>;
    '-C': z.ZodOptional<z.ZodNumber>;
    '-i': z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
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
}>;
export declare const globKnowledgeFilesInputSchema: z.ZodEffects<z.ZodObject<{
    pattern: z.ZodString;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
    caseSensitive: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
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
}>;
export declare const readKnowledgeInputSchema: z.ZodEffects<z.ZodObject<{
    file: z.ZodOptional<z.ZodString>;
    fileId: z.ZodOptional<z.ZodString>;
    ranges: z.ZodOptional<z.ZodArray<z.ZodObject<{
        startLine: z.ZodNumber;
        endLine: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        startLine: number;
        endLine: number;
    }, {
        startLine: number;
        endLine: number;
    }>, "many">>;
}, "strict", z.ZodTypeAny, {
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
}>;
export type SearchKnowledgeRequest = z.infer<typeof searchKnowledgeInputSchema>;
export type GlobKnowledgeFilesRequest = z.infer<typeof globKnowledgeFilesInputSchema>;
export type ReadKnowledgeRequest = z.infer<typeof readKnowledgeInputSchema>;
export interface AgentKnowledgeFileReference {
    file: string;
    fileId: string;
    storedAt: ExecutionDataStorageLocation;
    storageKey: string;
    displayName: string;
    mimeType: string;
    fileSizeBytes: number;
    createdAt: string;
}
type AgentKnowledgeFileIdentity = Pick<AgentKnowledgeFileReference, 'file' | 'fileId' | 'displayName'>;
export interface AgentKnowledgeCitation extends AgentKnowledgeFileIdentity {
    startLine: number;
    endLine: number;
}
export interface AgentKnowledgeLine {
    lineNumber: number;
    text: string;
    truncated: boolean;
}
export interface SearchKnowledgeMatch extends AgentKnowledgeFileIdentity {
    lineNumber: number;
    text: string;
    textTruncated: boolean;
    context?: SearchKnowledgeContextLine[];
}
export interface SearchKnowledgeContextLine {
    lineNumber: number;
    text: string;
    matched: boolean;
}
export interface SearchKnowledgeCount extends AgentKnowledgeFileIdentity {
    count: number;
}
export interface SearchKnowledgeContentResult {
    outputMode: 'content';
    matches: SearchKnowledgeMatch[];
    limit: number;
    hasMore: boolean;
    truncated: boolean;
}
export interface SearchKnowledgeFilesResult {
    outputMode: 'files_with_matches';
    files: AgentKnowledgeFileReference[];
    limit: number;
    hasMore: boolean;
    truncated: boolean;
}
export interface SearchKnowledgeCountResult {
    outputMode: 'count';
    counts: SearchKnowledgeCount[];
    limit: number;
    hasMore: boolean;
    truncated: boolean;
}
export type SearchKnowledgeResult = SearchKnowledgeContentResult | SearchKnowledgeFilesResult | SearchKnowledgeCountResult;
export interface GlobKnowledgeFilesResult {
    files: AgentKnowledgeFileReference[];
    limit: number;
    offset: number;
    hasMore: boolean;
}
export interface ReadKnowledgeRangeResult {
    startLine: number;
    endLine: number;
    text: string;
    citation: AgentKnowledgeCitation;
}
export interface ReadKnowledgeResult extends AgentKnowledgeFileIdentity {
    ranges: ReadKnowledgeRangeResult[];
    truncated: boolean;
}
export declare function parseSearchKnowledgeRequest(input: unknown): SearchKnowledgeRequest;
export declare function parseGlobKnowledgeFilesRequest(input: unknown): GlobKnowledgeFilesRequest;
export declare function parseReadKnowledgeRequest(input: unknown): ReadKnowledgeRequest;
export declare function assertValidKnowledgeFilePath(filePath: string): string;
export declare function truncateKnowledgeText(text: string, maxLength: number): {
    text: string;
    truncated: boolean;
};
export {};
