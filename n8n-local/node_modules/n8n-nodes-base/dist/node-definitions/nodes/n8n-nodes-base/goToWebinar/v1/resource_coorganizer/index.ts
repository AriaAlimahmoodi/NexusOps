/**
 * GoToWebinar - Coorganizer Resource
 * Re-exports all operation types for this resource.
 */

import type { GoToWebinarV1CoorganizerCreateNode } from './operation_create';
import type { GoToWebinarV1CoorganizerDeleteNode } from './operation_delete';
import type { GoToWebinarV1CoorganizerGetAllNode } from './operation_get_all';
import type { GoToWebinarV1CoorganizerReinviteNode } from './operation_reinvite';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_all';
export * from './operation_reinvite';

export type GoToWebinarV1CoorganizerNode =
  | GoToWebinarV1CoorganizerCreateNode
  | GoToWebinarV1CoorganizerDeleteNode
  | GoToWebinarV1CoorganizerGetAllNode
  | GoToWebinarV1CoorganizerReinviteNode
  ;