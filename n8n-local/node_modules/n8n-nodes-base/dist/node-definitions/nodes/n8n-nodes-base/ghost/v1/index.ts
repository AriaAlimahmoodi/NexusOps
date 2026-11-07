/**
 * Ghost Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { GhostV1PostNode } from './resource_post';

export * from './resource_post';

export type GhostV1Node = GhostV1PostNode;