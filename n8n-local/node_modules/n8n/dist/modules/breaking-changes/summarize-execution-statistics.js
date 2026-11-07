"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeExecutionStatistics = summarizeExecutionStatistics;
function summarizeExecutionStatistics(statistics) {
    let numberOfExecutions = 0;
    let lastExecutedAt;
    for (const statistic of statistics) {
        numberOfExecutions += statistic.count || 0;
        if (!lastExecutedAt || statistic.latestEvent > lastExecutedAt) {
            lastExecutedAt = statistic.latestEvent;
        }
    }
    return { numberOfExecutions, lastExecutedAt };
}
//# sourceMappingURL=summarize-execution-statistics.js.map