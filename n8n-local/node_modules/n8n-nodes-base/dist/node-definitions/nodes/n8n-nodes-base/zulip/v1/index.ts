/**
 * Zulip Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { ZulipV1MessageNode } from './resource_message';
import type { ZulipV1StreamNode } from './resource_stream';
import type { ZulipV1UserNode } from './resource_user';

export * from './resource_message';
export * from './resource_stream';
export * from './resource_user';

export type ZulipV1Node =
  | ZulipV1MessageNode
  | ZulipV1StreamNode
  | ZulipV1UserNode
  ;