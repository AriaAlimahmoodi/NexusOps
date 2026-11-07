export type CaseDifficulty = 'simple' | 'multi_step';
export type CaseInputFlavor = 'happy_path' | 'underspecified' | 'out_of_scope' | 'adversarial';
export interface DimensionTuple {
    capability: string;
    difficulty: CaseDifficulty;
    flavor: CaseInputFlavor;
}
export declare const CASE_DIFFICULTIES: readonly CaseDifficulty[];
export declare const CASE_INPUT_FLAVORS: readonly CaseInputFlavor[];
export declare const GENERAL_CAPABILITY = "general";
export declare function sampleDimensionTuples(capabilities: string[], count: number): DimensionTuple[];
