/**
 * SeaTable Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { SeaTableV2RowNode } from './resource_row';
import type { SeaTableV2BaseNode } from './resource_base';
import type { SeaTableV2LinkNode } from './resource_link';
import type { SeaTableV2AssetNode } from './resource_asset';

export * from './resource_row';
export * from './resource_base';
export * from './resource_link';
export * from './resource_asset';

export type SeaTableV2Node =
  | SeaTableV2RowNode
  | SeaTableV2BaseNode
  | SeaTableV2LinkNode
  | SeaTableV2AssetNode
  ;