/**
 * Magento 2 - Product Resource
 * Re-exports all operation types for this resource.
 */

import type { Magento2V1ProductCreateNode } from './operation_create';
import type { Magento2V1ProductDeleteNode } from './operation_delete';
import type { Magento2V1ProductGetNode } from './operation_get';
import type { Magento2V1ProductGetAllNode } from './operation_get_all';
import type { Magento2V1ProductUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type Magento2V1ProductNode =
  | Magento2V1ProductCreateNode
  | Magento2V1ProductDeleteNode
  | Magento2V1ProductGetNode
  | Magento2V1ProductGetAllNode
  | Magento2V1ProductUpdateNode
  ;