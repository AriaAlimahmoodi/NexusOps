/**
 * Magento 2 - Order Resource
 * Re-exports all operation types for this resource.
 */

import type { Magento2V1OrderCancelNode } from './operation_cancel';
import type { Magento2V1OrderGetNode } from './operation_get';
import type { Magento2V1OrderGetAllNode } from './operation_get_all';
import type { Magento2V1OrderShipNode } from './operation_ship';

export * from './operation_cancel';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_ship';

export type Magento2V1OrderNode =
  | Magento2V1OrderCancelNode
  | Magento2V1OrderGetNode
  | Magento2V1OrderGetAllNode
  | Magento2V1OrderShipNode
  ;