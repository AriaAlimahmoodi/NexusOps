import type { ExecutionsConfig } from '@n8n/config';
import type { License } from '../license';
export declare const EVALUATION_TIER_DEFAULTS: {
    readonly Community: 1;
    readonly Pro: 1;
    readonly Business: 3;
    readonly Enterprise: 5;
};
export type EvaluationConcurrencyLimitSource = 'env' | 'license' | 'tier';
export declare function resolveEvaluationConcurrencyLimit(executionsConfig: ExecutionsConfig, license: License): number;
export declare function getEvaluationConcurrencyLimitSource(license: License): EvaluationConcurrencyLimitSource;
