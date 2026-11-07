/**
 * Magento 2 - Customer Resource
 * Re-exports all operation types for this resource.
 */

import type { Magento2V1CustomerCreateNode } from './operation_create';
import type { Magento2V1CustomerDeleteNode } from './operation_delete';
import type { Magento2V1CustomerGetNode } from './operation_get';
import type { Magento2V1CustomerGetAllNode } from './operation_get_all';
import type { Magento2V1CustomerUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type Magento2V1CustomerNode =
  | Magento2V1CustomerCreateNode
  | Magento2V1CustomerDeleteNode
  | Magento2V1CustomerGetNode
  | Magento2V1CustomerGetAllNode
  | Magento2V1CustomerUpdateNode
  ;