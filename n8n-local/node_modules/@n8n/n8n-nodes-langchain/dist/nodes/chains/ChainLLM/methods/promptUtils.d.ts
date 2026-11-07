import type { AgentAction, AgentFinish } from '@langchain/core/agents';
import { BaseMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import type { N8nOutputParser } from '../../../../utils/output_parsers/N8nOutputParser';
import type { PromptParams } from './types';
export declare function createPromptTemplate({ context, itemIndex, llm, messages, formatInstructions, query, }: PromptParams): Promise<ChatPromptTemplate<any, any> | PromptTemplate<any, any>>;
export declare const getAgentStepsParser: (outputParser: N8nOutputParser) => (steps: AgentFinish | BaseMessage | AgentAction[] | string) => Promise<string | Record<string, unknown>>;
