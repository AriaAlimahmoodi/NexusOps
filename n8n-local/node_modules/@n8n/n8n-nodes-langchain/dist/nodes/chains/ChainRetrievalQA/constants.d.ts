import type { INodeProperties } from 'n8n-workflow';
export declare const SYSTEM_PROMPT_TEMPLATE = "You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question.\nIf you don't know the answer, just say that you don't know, don't try to make up an answer.\n----------------\nContext: {context}";
export declare const LEGACY_INPUT_TEMPLATE_KEY = "question";
export declare const INPUT_TEMPLATE_KEY = "input";
export declare const systemPromptOption: INodeProperties;
