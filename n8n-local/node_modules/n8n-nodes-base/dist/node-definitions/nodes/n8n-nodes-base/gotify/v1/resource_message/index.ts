/**
 * Gotify - Message Resource
 * Re-exports all operation types for this resource.
 */

import type { GotifyV1MessageCreateNode } from './operation_create';
import type { GotifyV1MessageDeleteNode } from './operation_delete';
import type { GotifyV1MessageGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_all';

export type GotifyV1MessageNode =
  | GotifyV1MessageCreateNode
  | GotifyV1MessageDeleteNode
  | GotifyV1MessageGetAllNode
  ;