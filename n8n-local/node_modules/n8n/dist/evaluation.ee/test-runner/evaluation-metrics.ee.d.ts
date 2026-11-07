import type { IDataObject } from 'n8n-workflow';
export interface EvaluationMetricsAddResultsInfo {
    addedMetrics: Record<string, number>;
    incorrectTypeMetrics: Set<string>;
}
export interface MetricContribution {
    addedMetrics: Record<string, number>;
}
export declare class EvaluationMetrics {
    private readonly rawMetricsByName;
    static buildContribution(result: IDataObject): MetricContribution;
    mergeContribution(contribution: MetricContribution): void;
    addResults(result: IDataObject): EvaluationMetricsAddResultsInfo;
    getAggregatedMetrics(): Record<string, number>;
}
