/**
 * Google Workspace Admin - Device Resource
 * Re-exports all operation types for this resource.
 */

import type { GSuiteAdminV1DeviceChangeStatusNode } from './operation_change_status';
import type { GSuiteAdminV1DeviceGetNode } from './operation_get';
import type { GSuiteAdminV1DeviceGetAllNode } from './operation_get_all';
import type { GSuiteAdminV1DeviceUpdateNode } from './operation_update';

export * from './operation_change_status';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GSuiteAdminV1DeviceNode =
  | GSuiteAdminV1DeviceChangeStatusNode
  | GSuiteAdminV1DeviceGetNode
  | GSuiteAdminV1DeviceGetAllNode
  | GSuiteAdminV1DeviceUpdateNode
  ;