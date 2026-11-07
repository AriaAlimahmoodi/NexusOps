/**
 * GoToWebinar - Registrant Resource
 * Re-exports all operation types for this resource.
 */

import type { GoToWebinarV1RegistrantCreateNode } from './operation_create';
import type { GoToWebinarV1RegistrantDeleteNode } from './operation_delete';
import type { GoToWebinarV1RegistrantGetNode } from './operation_get';
import type { GoToWebinarV1RegistrantGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type GoToWebinarV1RegistrantNode =
  | GoToWebinarV1RegistrantCreateNode
  | GoToWebinarV1RegistrantDeleteNode
  | GoToWebinarV1RegistrantGetNode
  | GoToWebinarV1RegistrantGetAllNode
  ;