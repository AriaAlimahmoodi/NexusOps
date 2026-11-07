import type { Logger } from '@n8n/backend-common';
import type { TemplateSearchResponse, Category, TemplateFetchResponse, WorkflowMetadata } from '../../types';
export declare function fetchTemplateList(query: {
    search?: string;
    category?: Category;
    rows?: number;
    nodes?: string;
}): Promise<TemplateSearchResponse>;
export declare function fetchTemplateByID(id: number): Promise<TemplateFetchResponse>;
export interface FetchWorkflowsResult {
    workflows: WorkflowMetadata[];
    totalFound: number;
    templateIds: number[];
}
export declare function fetchWorkflowsFromTemplates(query: {
    search?: string;
    category?: Category;
    rows?: number;
    nodes?: string;
}, options?: {
    maxTemplates?: number;
    logger?: Logger;
}): Promise<FetchWorkflowsResult>;
