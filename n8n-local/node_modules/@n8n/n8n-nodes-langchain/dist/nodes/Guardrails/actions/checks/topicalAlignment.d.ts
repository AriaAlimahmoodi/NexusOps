import type { CreateCheckFn, LLMConfig } from '../types';
export declare const TOPICAL_ALIGNMENT_SYSTEM_PROMPT = "You are a content analysis system that determines if text stays on topic.\n\nBUSINESS SCOPE: [INSERT BUSINESS SCOPE HERE]\n\nDetermine if the text stays within the defined business scope. Flag any content\nthat strays from the allowed topics.";
export declare const createTopicalAlignmentCheckFn: CreateCheckFn<LLMConfig>;
