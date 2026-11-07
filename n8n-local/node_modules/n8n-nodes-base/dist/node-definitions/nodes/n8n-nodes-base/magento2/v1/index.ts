/**
 * Magento 2 Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { Magento2V1CustomerNode } from './resource_customer';
import type { Magento2V1InvoiceNode } from './resource_invoice';
import type { Magento2V1OrderNode } from './resource_order';
import type { Magento2V1ProductNode } from './resource_product';

export * from './resource_customer';
export * from './resource_invoice';
export * from './resource_order';
export * from './resource_product';

export type Magento2V1Node =
  | Magento2V1CustomerNode
  | Magento2V1InvoiceNode
  | Magento2V1OrderNode
  | Magento2V1ProductNode
  ;