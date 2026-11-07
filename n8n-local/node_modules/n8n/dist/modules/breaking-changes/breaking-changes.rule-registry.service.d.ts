import { Logger } from '@n8n/backend-common';
import type { IBreakingChangeRule } from './types';
export declare class RuleRegistry {
    private readonly logger;
    private readonly rules;
    constructor(logger: Logger);
    register(rule: IBreakingChangeRule): void;
    registerAll(rules: IBreakingChangeRule[]): void;
    getRule(id: string): IBreakingChangeRule | undefined;
    getRules(version?: string): IBreakingChangeRule[];
}
