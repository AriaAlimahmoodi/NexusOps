import type { NonEmptyViolations } from '../../../policy/policy-violation.error';
export interface ToolPolicyRefusalResult {
    isPolicyRefusal: true;
    message: string;
    violations: NonEmptyViolations;
    instruction: string;
}
export declare function toPolicyRefusalResult(message: string, violations: NonEmptyViolations): ToolPolicyRefusalResult;
