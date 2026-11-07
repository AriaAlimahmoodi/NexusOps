/**
 * Help Scout - Thread Resource
 * Re-exports all operation types for this resource.
 */

import type { HelpScoutV1ThreadCreateNode } from './operation_create';
import type { HelpScoutV1ThreadGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_get_all';

export type HelpScoutV1ThreadNode =
  | HelpScoutV1ThreadCreateNode
  | HelpScoutV1ThreadGetAllNode
  ;