import type { AgentFileDto } from '@n8n/api-types';
import { type SandboxProvider } from '@n8n/agents/sandbox';
import type { AgentFile } from './entities/agent-file.entity';
export interface AgentKnowledgePaths {
    filesDir: string;
    manifest: string;
    stagingDir: string;
}
export declare function getAgentKnowledgePaths(provider: SandboxProvider): AgentKnowledgePaths;
export declare function hasControlCharacter(value: string): boolean;
export declare function assertKnowledgePathSegment(segment: string, label: string): void;
export declare function storageFileNameForOriginalFileName(originalFileName: string): string;
export declare function toAgentFileDto(file: AgentFile): AgentFileDto;
