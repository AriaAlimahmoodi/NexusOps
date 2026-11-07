/**
 * Data table Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { DataTableV1RowNode } from './resource_row';
import type { DataTableV1TableNode } from './resource_table';

export * from './resource_row';
export * from './resource_table';

export type DataTableV1Node =
  | DataTableV1RowNode
  | DataTableV1TableNode
  ;