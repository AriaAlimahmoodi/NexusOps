/**
 * Microsoft Dynamics CRM - Account Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftDynamicsCrmV1AccountCreateNode } from './operation_create';
import type { MicrosoftDynamicsCrmV1AccountDeleteNode } from './operation_delete';
import type { MicrosoftDynamicsCrmV1AccountGetNode } from './operation_get';
import type { MicrosoftDynamicsCrmV1AccountGetAllNode } from './operation_get_all';
import type { MicrosoftDynamicsCrmV1AccountUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MicrosoftDynamicsCrmV1AccountNode =
  | MicrosoftDynamicsCrmV1AccountCreateNode
  | MicrosoftDynamicsCrmV1AccountDeleteNode
  | MicrosoftDynamicsCrmV1AccountGetNode
  | MicrosoftDynamicsCrmV1AccountGetAllNode
  | MicrosoftDynamicsCrmV1AccountUpdateNode
  ;