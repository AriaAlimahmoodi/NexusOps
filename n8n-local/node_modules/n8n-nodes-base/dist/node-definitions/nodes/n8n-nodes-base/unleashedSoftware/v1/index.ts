/**
 * Unleashed Software Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { UnleashedSoftwareV1SalesOrderNode } from './resource_sales_order';
import type { UnleashedSoftwareV1StockOnHandNode } from './resource_stock_on_hand';

export * from './resource_sales_order';
export * from './resource_stock_on_hand';

export type UnleashedSoftwareV1Node =
  | UnleashedSoftwareV1SalesOrderNode
  | UnleashedSoftwareV1StockOnHandNode
  ;