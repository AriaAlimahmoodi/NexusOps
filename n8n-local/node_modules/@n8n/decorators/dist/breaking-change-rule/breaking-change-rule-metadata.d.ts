import { type Constructable } from '@n8n/di';
type RuleEntry = {
    class: Constructable;
    version: string;
};
export declare class BreakingChangeRuleMetadata {
    private readonly rules;
    register(ruleEntry: RuleEntry): void;
    getEntries(): RuleEntry[];
    getClasses(): Constructable[];
}
export {};
