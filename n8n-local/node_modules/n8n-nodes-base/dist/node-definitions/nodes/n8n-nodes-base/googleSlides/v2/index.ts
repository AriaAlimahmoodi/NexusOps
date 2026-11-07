/**
 * Google Slides Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { GoogleSlidesV2PageNode } from './resource_page';
import type { GoogleSlidesV2PresentationNode } from './resource_presentation';

export * from './resource_page';
export * from './resource_presentation';

export type GoogleSlidesV2Node =
  | GoogleSlidesV2PageNode
  | GoogleSlidesV2PresentationNode
  ;