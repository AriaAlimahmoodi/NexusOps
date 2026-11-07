/**
 * TravisCI Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { TravisCiV1BuildNode } from './resource_build';

export * from './resource_build';

export type TravisCiV1Node = TravisCiV1BuildNode;