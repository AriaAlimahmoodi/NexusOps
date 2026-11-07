"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvalTimings = void 0;
const PHASE_ORDER = ['hints', 'bypass-pin', 'http-mock', 'ai-turn'];
class EvalTimings {
    constructor() {
        this.samples = [];
        this.startedAt = Date.now();
        this.enabled = process.env.N8N_INSTANCE_AI_EVAL_TIMING === 'true';
    }
    async time(phase, label, fn) {
        if (!this.enabled)
            return await fn();
        const start = Date.now();
        try {
            return await fn();
        }
        finally {
            this.samples.push({ phase, label, durationMs: Date.now() - start });
        }
    }
    summary(logger) {
        if (!this.enabled)
            return;
        for (const phase of PHASE_ORDER) {
            const durations = this.samples.filter((s) => s.phase === phase).map((s) => s.durationMs);
            if (durations.length === 0)
                continue;
            const total = durations.reduce((sum, d) => sum + d, 0);
            logger.info(`[EvalMock][timing] phase=${phase} calls=${durations.length} total=${fmt(total)} p50=${fmt(percentile(durations, 50))} max=${fmt(Math.max(...durations))}`);
        }
        const llmTotal = this.samples.reduce((sum, s) => sum + s.durationMs, 0);
        const model = process.env.N8N_INSTANCE_AI_EVAL_MODEL ??
            process.env.N8N_INSTANCE_AI_MODEL ??
            'anthropic/claude-sonnet-4-6';
        logger.info(`[EvalMock][timing] SUMMARY wall=${fmt(Date.now() - this.startedAt)} llmCalls=${this.samples.length} llmTotal=${fmt(llmTotal)} model=${model}`);
    }
}
exports.EvalTimings = EvalTimings;
function fmt(ms) {
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}
function percentile(values, p) {
    if (values.length === 0)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return sorted[index];
}
//# sourceMappingURL=eval-timings.js.map