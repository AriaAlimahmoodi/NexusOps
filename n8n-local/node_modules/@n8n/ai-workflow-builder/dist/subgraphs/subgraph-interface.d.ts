type StateRecord = Record<string, unknown>;
interface InvokeConfig {
    recursionLimit?: number;
}
export interface ISubgraph<TConfig = unknown, TChildState extends StateRecord = StateRecord, TParentState extends StateRecord = StateRecord> {
    name: string;
    description: string;
    create(config: TConfig): {
        invoke: (input: Partial<TChildState>, config?: InvokeConfig) => Promise<TChildState>;
    };
    transformInput: (parentState: TParentState) => Partial<TChildState>;
    transformOutput: (childOutput: TChildState, parentState: TParentState) => Partial<TParentState>;
}
export declare abstract class BaseSubgraph<TConfig = unknown, TChildState extends StateRecord = StateRecord, TParentState extends StateRecord = StateRecord> implements ISubgraph<TConfig, TChildState, TParentState> {
    abstract name: string;
    abstract description: string;
    abstract create(config: TConfig): {
        invoke: (input: Partial<TChildState>, config?: InvokeConfig) => Promise<TChildState>;
    };
    abstract transformInput(parentState: TParentState): Partial<TChildState>;
    abstract transformOutput(childOutput: TChildState, parentState: TParentState): Partial<TParentState>;
}
export {};
