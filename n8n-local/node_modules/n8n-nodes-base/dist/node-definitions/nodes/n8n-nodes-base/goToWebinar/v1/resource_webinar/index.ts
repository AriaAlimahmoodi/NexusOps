/**
 * GoToWebinar - Webinar Resource
 * Re-exports all operation types for this resource.
 */

import type { GoToWebinarV1WebinarCreateNode } from './operation_create';
import type { GoToWebinarV1WebinarGetNode } from './operation_get';
import type { GoToWebinarV1WebinarGetAllNode } from './operation_get_all';
import type { GoToWebinarV1WebinarUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GoToWebinarV1WebinarNode =
  | GoToWebinarV1WebinarCreateNode
  | GoToWebinarV1WebinarGetNode
  | GoToWebinarV1WebinarGetAllNode
  | GoToWebinarV1WebinarUpdateNode
  ;