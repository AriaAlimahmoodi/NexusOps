/**
 * Intercom - Lead Resource
 * Re-exports all operation types for this resource.
 */

import type { IntercomV1LeadCreateNode } from './operation_create';
import type { IntercomV1LeadDeleteNode } from './operation_delete';
import type { IntercomV1LeadGetNode } from './operation_get';
import type { IntercomV1LeadGetAllNode } from './operation_get_all';
import type { IntercomV1LeadUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type IntercomV1LeadNode =
  | IntercomV1LeadCreateNode
  | IntercomV1LeadDeleteNode
  | IntercomV1LeadGetNode
  | IntercomV1LeadGetAllNode
  | IntercomV1LeadUpdateNode
  ;