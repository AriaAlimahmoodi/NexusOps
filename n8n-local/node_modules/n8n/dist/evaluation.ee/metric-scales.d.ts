import { type MetricScale } from '@n8n/api-types';
import type { EvaluationConfigRepository, TestRun } from '@n8n/db';
export declare function resolveConfigMetricScales(evalConfigRepo: EvaluationConfigRepository, evaluationConfigId: string, workflowId: string): Promise<Record<string, MetricScale>>;
export declare function runMetricScales(run: Pick<TestRun, 'evaluationConfigSnapshot'>, defaultScales: Record<string, MetricScale>): Record<string, MetricScale>;
