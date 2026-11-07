/**
 * Unleashed Software - StockOnHand Resource
 * Re-exports all operation types for this resource.
 */

import type { UnleashedSoftwareV1StockOnHandGetNode } from './operation_get';
import type { UnleashedSoftwareV1StockOnHandGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type UnleashedSoftwareV1StockOnHandNode =
  | UnleashedSoftwareV1StockOnHandGetNode
  | UnleashedSoftwareV1StockOnHandGetAllNode
  ;