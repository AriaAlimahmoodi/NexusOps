/**
 * KoBoToolbox - Submission Resource
 * Re-exports all operation types for this resource.
 */

import type { KoBoToolboxV1SubmissionDeleteNode } from './operation_delete';
import type { KoBoToolboxV1SubmissionGetNode } from './operation_get';
import type { KoBoToolboxV1SubmissionGetAllNode } from './operation_get_all';
import type { KoBoToolboxV1SubmissionGetValidationNode } from './operation_get_validation';
import type { KoBoToolboxV1SubmissionSetValidationNode } from './operation_set_validation';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_validation';
export * from './operation_set_validation';

export type KoBoToolboxV1SubmissionNode =
  | KoBoToolboxV1SubmissionDeleteNode
  | KoBoToolboxV1SubmissionGetNode
  | KoBoToolboxV1SubmissionGetAllNode
  | KoBoToolboxV1SubmissionGetValidationNode
  | KoBoToolboxV1SubmissionSetValidationNode
  ;