/**
 * Freshservice - Problem Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshserviceV1ProblemCreateNode } from './operation_create';
import type { FreshserviceV1ProblemDeleteNode } from './operation_delete';
import type { FreshserviceV1ProblemGetNode } from './operation_get';
import type { FreshserviceV1ProblemGetAllNode } from './operation_get_all';
import type { FreshserviceV1ProblemUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshserviceV1ProblemNode =
  | FreshserviceV1ProblemCreateNode
  | FreshserviceV1ProblemDeleteNode
  | FreshserviceV1ProblemGetNode
  | FreshserviceV1ProblemGetAllNode
  | FreshserviceV1ProblemUpdateNode
  ;