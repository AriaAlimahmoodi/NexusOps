import { type AgentJsonConfig } from '@n8n/api-types';
import { z } from 'zod';
import { type DimensionTuple } from './dimensions';
export declare const generatedCasesSchema: z.ZodObject<{
    cases: z.ZodArray<z.ZodObject<{
        input: z.ZodString;
        whatToCheck: z.ZodString;
        scenario: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        input: string;
        whatToCheck: string;
        scenario: string;
    }, {
        input: string;
        whatToCheck: string;
        scenario: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    cases: {
        input: string;
        whatToCheck: string;
        scenario: string;
    }[];
}, {
    cases: {
        input: string;
        whatToCheck: string;
        scenario: string;
    }[];
}>;
export declare const MAX_INSTRUCTIONS_CHARS = 4000;
export declare const MAX_CONTEXT_FIELD_CHARS = 2000;
export interface CaseRevisionContext {
    suggestion: string;
    previousInput: string;
    previousOutput: string;
}
export interface CaseExampleContext {
    input: string;
    output: string;
}
export interface AgentConfigSummary {
    name: string;
    instructions: string;
    tools: Array<{
        name: string;
        description?: string;
    }>;
}
export declare function truncate(text: string, max: number): string;
export declare function buildAgentSummary(config: AgentJsonConfig): AgentConfigSummary;
export declare function deriveCapabilities(config: AgentJsonConfig): string[];
export declare const CASE_GENERATION_SYSTEM_PROMPT: string;
export declare function buildCaseGenerationUserPrompt(summary: AgentConfigSummary, tuples: DimensionTuple[], revision?: CaseRevisionContext, example?: CaseExampleContext, rule?: string): string;
