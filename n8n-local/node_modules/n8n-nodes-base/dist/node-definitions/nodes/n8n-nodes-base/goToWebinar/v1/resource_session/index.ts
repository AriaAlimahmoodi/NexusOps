/**
 * GoToWebinar - Session Resource
 * Re-exports all operation types for this resource.
 */

import type { GoToWebinarV1SessionGetNode } from './operation_get';
import type { GoToWebinarV1SessionGetAllNode } from './operation_get_all';
import type { GoToWebinarV1SessionGetDetailsNode } from './operation_get_details';

export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_details';

export type GoToWebinarV1SessionNode =
  | GoToWebinarV1SessionGetNode
  | GoToWebinarV1SessionGetAllNode
  | GoToWebinarV1SessionGetDetailsNode
  ;