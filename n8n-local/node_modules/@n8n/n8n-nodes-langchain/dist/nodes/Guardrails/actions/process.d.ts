import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { IExecuteFunctions } from 'n8n-workflow';
import type { GuardrailUserResult } from './types';
interface Result {
    checks: GuardrailUserResult[];
}
export declare function process(this: IExecuteFunctions, itemIndex: number, model: BaseChatModel | null): Promise<{
    guardrailsInput: string;
    passed: Result | null;
    failed: Result | null;
}>;
export {};
