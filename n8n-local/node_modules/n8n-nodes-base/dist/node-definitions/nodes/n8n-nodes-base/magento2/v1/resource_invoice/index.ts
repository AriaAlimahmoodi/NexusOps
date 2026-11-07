/**
 * Magento 2 - Invoice Resource
 * Re-exports all operation types for this resource.
 */

import type { Magento2V1InvoiceCreateNode } from './operation_create';

export * from './operation_create';

export type Magento2V1InvoiceNode = Magento2V1InvoiceCreateNode;