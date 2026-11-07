export type DisplayConditionOperator = 'eq' | 'not' | 'gte' | 'lte' | 'gt' | 'lt' | 'between' | 'includes' | 'startsWith' | 'endsWith' | 'regex' | 'exists';
export type DisplayCondition = {
    _cnd: Partial<Record<DisplayConditionOperator, unknown>>;
};
export type DisplayOptions = {
    show?: Record<string, unknown[]>;
    hide?: Record<string, unknown[]>;
};
export type DisplayOptionsContext = {
    parameters: Record<string, unknown>;
    nodeVersion?: number;
    rootParameters?: Record<string, unknown>;
    defaults?: Record<string, unknown>;
    isToolNode?: boolean;
};
export declare function checkConditions(conditions: unknown[], actualValues: unknown[]): boolean;
export declare function getPropertyValue(context: DisplayOptionsContext, propertyName: string): unknown[];
export declare function matchesDisplayOptions(context: DisplayOptionsContext, displayOptions: DisplayOptions): boolean;
