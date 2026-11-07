"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationMetrics = void 0;
const db_1 = require("@n8n/db");
const errors_ee_1 = require("../../evaluation.ee/test-runner/errors.ee");
class EvaluationMetrics {
    constructor() {
        this.rawMetricsByName = new Map();
    }
    static buildContribution(result) {
        const addedMetrics = {};
        for (const [metricName, metricValue] of Object.entries(result)) {
            if (typeof metricValue === 'number') {
                addedMetrics[metricName] = metricValue;
            }
            else {
                throw new errors_ee_1.TestCaseExecutionError(db_1.TestCaseExecutionErrorCode.INVALID_METRICS, {
                    metricName,
                    metricValue,
                });
            }
        }
        return { addedMetrics };
    }
    mergeContribution(contribution) {
        for (const [metricName, metricValue] of Object.entries(contribution.addedMetrics)) {
            let bucket = this.rawMetricsByName.get(metricName);
            if (!bucket) {
                bucket = [];
                this.rawMetricsByName.set(metricName, bucket);
            }
            bucket.push(metricValue);
        }
    }
    addResults(result) {
        const contribution = EvaluationMetrics.buildContribution(result);
        this.mergeContribution(contribution);
        return {
            addedMetrics: contribution.addedMetrics,
            incorrectTypeMetrics: new Set(),
        };
    }
    getAggregatedMetrics() {
        const aggregatedMetrics = {};
        for (const [metricName, metricValues] of this.rawMetricsByName.entries()) {
            if (metricValues.length > 0) {
                const metricSum = metricValues.reduce((acc, val) => acc + val, 0);
                aggregatedMetrics[metricName] = metricSum / metricValues.length;
            }
        }
        return aggregatedMetrics;
    }
}
exports.EvaluationMetrics = EvaluationMetrics;
//# sourceMappingURL=evaluation-metrics.ee.js.map