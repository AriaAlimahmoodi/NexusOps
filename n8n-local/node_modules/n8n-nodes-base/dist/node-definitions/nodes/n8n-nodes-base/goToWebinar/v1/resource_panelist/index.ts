/**
 * GoToWebinar - Panelist Resource
 * Re-exports all operation types for this resource.
 */

import type { GoToWebinarV1PanelistCreateNode } from './operation_create';
import type { GoToWebinarV1PanelistDeleteNode } from './operation_delete';
import type { GoToWebinarV1PanelistGetAllNode } from './operation_get_all';
import type { GoToWebinarV1PanelistReinviteNode } from './operation_reinvite';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_all';
export * from './operation_reinvite';

export type GoToWebinarV1PanelistNode =
  | GoToWebinarV1PanelistCreateNode
  | GoToWebinarV1PanelistDeleteNode
  | GoToWebinarV1PanelistGetAllNode
  | GoToWebinarV1PanelistReinviteNode
  ;