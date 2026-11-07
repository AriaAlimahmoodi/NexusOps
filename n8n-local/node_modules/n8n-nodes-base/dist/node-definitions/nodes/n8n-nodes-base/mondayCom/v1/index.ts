/**
 * Monday.com Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MondayComV1BoardNode } from './resource_board';
import type { MondayComV1BoardColumnNode } from './resource_board_column';
import type { MondayComV1BoardGroupNode } from './resource_board_group';
import type { MondayComV1BoardItemNode } from './resource_board_item';

export * from './resource_board';
export * from './resource_board_column';
export * from './resource_board_group';
export * from './resource_board_item';

export type MondayComV1Node =
  | MondayComV1BoardNode
  | MondayComV1BoardColumnNode
  | MondayComV1BoardGroupNode
  | MondayComV1BoardItemNode
  ;