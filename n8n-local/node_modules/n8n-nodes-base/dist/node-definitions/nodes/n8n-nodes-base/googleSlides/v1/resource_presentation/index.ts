/**
 * Google Slides - Presentation Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSlidesV1PresentationCreateNode } from './operation_create';
import type { GoogleSlidesV1PresentationGetNode } from './operation_get';
import type { GoogleSlidesV1PresentationGetSlidesNode } from './operation_get_slides';
import type { GoogleSlidesV1PresentationReplaceTextNode } from './operation_replace_text';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_slides';
export * from './operation_replace_text';

export type GoogleSlidesV1PresentationNode =
  | GoogleSlidesV1PresentationCreateNode
  | GoogleSlidesV1PresentationGetNode
  | GoogleSlidesV1PresentationGetSlidesNode
  | GoogleSlidesV1PresentationReplaceTextNode
  ;