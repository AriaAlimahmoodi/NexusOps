/**
 * Google Slides - Presentation Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSlidesV2PresentationCreateNode } from './operation_create';
import type { GoogleSlidesV2PresentationGetNode } from './operation_get';
import type { GoogleSlidesV2PresentationGetSlidesNode } from './operation_get_slides';
import type { GoogleSlidesV2PresentationReplaceTextNode } from './operation_replace_text';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_slides';
export * from './operation_replace_text';

export type GoogleSlidesV2PresentationNode =
  | GoogleSlidesV2PresentationCreateNode
  | GoogleSlidesV2PresentationGetNode
  | GoogleSlidesV2PresentationGetSlidesNode
  | GoogleSlidesV2PresentationReplaceTextNode
  ;