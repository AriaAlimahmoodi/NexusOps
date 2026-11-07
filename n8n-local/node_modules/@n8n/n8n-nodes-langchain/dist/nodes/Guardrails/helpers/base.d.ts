import { type GroupedGuardrailResults, type StageGuardRails } from '../actions/types';
type RunStageGuardrailsOptions = {
    stageGuardrails: StageGuardRails;
    stage: keyof StageGuardRails;
    inputText: string;
    failOnlyOnErrors?: boolean;
};
export declare function runStageGuardrails({ stageGuardrails, stage, inputText, failOnlyOnErrors, }: RunStageGuardrailsOptions): Promise<GroupedGuardrailResults>;
export {};
