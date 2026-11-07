/**
 * Google Slides Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { GoogleSlidesV1PageNode } from './resource_page';
import type { GoogleSlidesV1PresentationNode } from './resource_presentation';

export * from './resource_page';
export * from './resource_presentation';

export type GoogleSlidesV1Node =
  | GoogleSlidesV1PageNode
  | GoogleSlidesV1PresentationNode
  ;