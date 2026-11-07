import type { User } from '@n8n/db';
import z from 'zod';
import type { Telemetry } from '../../../../telemetry';
import type { ToolDefinition } from '../../mcp.types';
declare const inputSchema: {
    technique: z.ZodEnum<["list", ...("chatbot" | "content_generation" | "data_analysis" | "data_extraction" | "data_persistence" | "data_transformation" | "document_processing" | "enrichment" | "form_input" | "human_in_the_loop" | "knowledge_base" | "monitoring" | "notification" | "scheduling" | "scraping_and_research" | "triage" | "web_app")[]]>;
};
export declare const createGetWorkflowBestPracticesTool: (user: User, telemetry: Telemetry) => ToolDefinition<typeof inputSchema>;
export {};
