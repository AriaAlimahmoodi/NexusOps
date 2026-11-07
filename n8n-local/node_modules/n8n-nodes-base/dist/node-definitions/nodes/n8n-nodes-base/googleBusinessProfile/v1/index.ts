/**
 * Google Business Profile Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { GoogleBusinessProfileV1PostNode } from './resource_post';
import type { GoogleBusinessProfileV1ReviewNode } from './resource_review';

export * from './resource_post';
export * from './resource_review';

export type GoogleBusinessProfileV1Node =
  | GoogleBusinessProfileV1PostNode
  | GoogleBusinessProfileV1ReviewNode
  ;