"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVALUATION_TIER_DEFAULTS = void 0;
exports.resolveEvaluationConcurrencyLimit = resolveEvaluationConcurrencyLimit;
exports.getEvaluationConcurrencyLimitSource = getEvaluationConcurrencyLimitSource;
exports.EVALUATION_TIER_DEFAULTS = {
    Community: 1,
    Pro: 1,
    Business: 3,
    Enterprise: 5,
};
const EVALUATION_CONCURRENCY_ENV_VAR = 'N8N_CONCURRENCY_EVALUATION_LIMIT';
const EVALUATION_CONCURRENCY_QUOTA = 'quota:evaluations:concurrencyLimit';
const isPlanTier = (name) => name in exports.EVALUATION_TIER_DEFAULTS;
function readLicenseQuota(license) {
    const raw = license.getValue(EVALUATION_CONCURRENCY_QUOTA);
    if (typeof raw !== 'number')
        return undefined;
    if (raw === 0)
        return undefined;
    return raw;
}
function resolveEvaluationConcurrencyLimit(executionsConfig, license) {
    if (process.env[EVALUATION_CONCURRENCY_ENV_VAR] !== undefined) {
        return executionsConfig.concurrency.evaluationLimit;
    }
    const fromLicense = readLicenseQuota(license);
    if (fromLicense !== undefined)
        return fromLicense;
    const planName = license.getPlanName();
    return isPlanTier(planName) ? exports.EVALUATION_TIER_DEFAULTS[planName] : 1;
}
function getEvaluationConcurrencyLimitSource(license) {
    if (process.env[EVALUATION_CONCURRENCY_ENV_VAR] !== undefined)
        return 'env';
    if (readLicenseQuota(license) !== undefined)
        return 'license';
    return 'tier';
}
//# sourceMappingURL=evaluation-concurrency.helper.js.map