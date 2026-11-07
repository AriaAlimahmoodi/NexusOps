import { type GuardrailResult, type GuardrailUserResult } from '../actions/types';
export declare const mapGuardrailResultToUserResult: (result: GuardrailResult | PromiseSettledResult<GuardrailResult>) => GuardrailUserResult;
export declare const mapGuardrailErrorsToMessage: (results: Array<PromiseSettledResult<GuardrailResult>>) => string;
export declare const wrapResultsToNodeExecutionData: (checks: GuardrailUserResult[], itemIndex: number) => {
    json: {
        checks: GuardrailUserResult[];
    };
    pairedItem: {
        item: number;
    };
}[];
