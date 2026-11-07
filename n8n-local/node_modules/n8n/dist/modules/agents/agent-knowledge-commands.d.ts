import { type SearchKnowledgeCount, type AgentKnowledgeFileReference, type ReadKnowledgeRangeResult, type ReadKnowledgeRequest, type SearchKnowledgeMatch, type SearchKnowledgeRequest } from './agent-knowledge-retrieval';
import { type AgentKnowledgePaths } from './agent-knowledge-storage';
export declare const MIRROR_SYNC_TIMEOUT_SECONDS = 120;
export declare const KNOWLEDGE_FILES_DIR_UNAVAILABLE_EXIT_CODE = 3;
export interface SearchContextWindow {
    before: number;
    after: number;
}
export declare function buildSearchKnowledgeCommand(request: SearchKnowledgeRequest, scopedFiles: string[]): string;
export declare function estimateSearchOutputLimit(request: Pick<SearchKnowledgeRequest, '-C'>, matchLimit: number): number;
export declare function getSearchContextWindow(request: Pick<SearchKnowledgeRequest, '-C'>): SearchContextWindow;
export declare function buildReadKnowledgeCommand(file: string, request: ReadKnowledgeRequest): string;
export declare function parseRipgrepOutput(output: string, filesByPath: Map<string, AgentKnowledgeFileReference>, contextWindow?: SearchContextWindow): {
    matches: SearchKnowledgeMatch[];
    incomplete: boolean;
};
export declare function parseRipgrepFilesOutput(output: string, filesByPath: Map<string, AgentKnowledgeFileReference>): {
    files: AgentKnowledgeFileReference[];
    incomplete: boolean;
};
export declare function parseRipgrepCountOutput(output: string, filesByPath: Map<string, AgentKnowledgeFileReference>): {
    counts: SearchKnowledgeCount[];
    incomplete: boolean;
};
export declare function parseReadKnowledgeOutput(output: string, file: AgentKnowledgeFileReference, request: ReadKnowledgeRequest): {
    ranges: ReadKnowledgeRangeResult[];
    truncated: boolean;
};
export declare function buildScopedKnowledgeShellCommand(command: string, paths: AgentKnowledgePaths): string;
export declare function buildMirrorFinalizeCommand(toCopy: string[], toDelete: string[], manifestFiles: Array<Pick<AgentKnowledgeFileReference, 'file' | 'fileId'>>, paths: AgentKnowledgePaths, stagingId: string): string;
