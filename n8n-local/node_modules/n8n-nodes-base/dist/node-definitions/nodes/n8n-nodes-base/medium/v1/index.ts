/**
 * Medium Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MediumV1PostNode } from './resource_post';
import type { MediumV1PublicationNode } from './resource_publication';

export * from './resource_post';
export * from './resource_publication';

export type MediumV1Node =
  | MediumV1PostNode
  | MediumV1PublicationNode
  ;