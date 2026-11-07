/**
 * Data table Node - Version 1.1
 * Re-exports all discriminator combinations.
 */

import type { DataTableV11RowNode } from './resource_row';
import type { DataTableV11TableNode } from './resource_table';

export * from './resource_row';
export * from './resource_table';

export type DataTableV11Node =
  | DataTableV11RowNode
  | DataTableV11TableNode
  ;