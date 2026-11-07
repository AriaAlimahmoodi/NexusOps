import type { RedactionFloor } from '@n8n/api-types';
import type { WorkflowSettings } from 'n8n-workflow';
type RedactionPolicy = WorkflowSettings.RedactionPolicy;
export declare const REDACTION_FLOOR_VIOLATION_MESSAGE = "Workflow redaction policy cannot be weaker than the instance floor.";
export declare function policyMeetsFloor(policy: RedactionPolicy, floor: RedactionFloor): boolean;
export declare function policyForFloor(floor: RedactionFloor): RedactionPolicy | undefined;
export {};
