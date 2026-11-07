import type { User } from '@n8n/db';
import z from 'zod';
import type { TagService } from '../../../services/tag.service';
import type { Telemetry } from '../../../telemetry';
import type { ToolDefinition } from '../mcp.types';
declare const inputSchema: {
    limit: z.ZodOptional<z.ZodNumber>;
};
export type ListTagsParams = {
    limit?: number;
};
export type ListTagsItem = {
    id: string;
    name: string;
    usageCount: number;
    createdAt: string;
    updatedAt: string;
};
export type ListTagsResult = {
    data: ListTagsItem[];
    count: number;
    totalCount: number;
};
export declare const createListTagsTool: (user: User, tagService: TagService, telemetry: Telemetry) => ToolDefinition<typeof inputSchema>;
export declare function listTags(tagService: TagService, { limit }?: ListTagsParams): Promise<ListTagsResult>;
export {};
