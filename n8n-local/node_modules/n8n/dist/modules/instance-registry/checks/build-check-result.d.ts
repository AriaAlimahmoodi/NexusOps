import type { ClusterCheckResult } from '@n8n/decorators';
export declare function buildCheckResult(args: {
    hasProblem: boolean;
    hadProblem: boolean;
    fingerprint: string;
    previousFingerprint: string;
    code: string;
    severity: 'warning' | 'error';
    message: string;
    context: Record<string, unknown>;
    auditDetected: string;
    auditResolved: string;
}): ClusterCheckResult;
