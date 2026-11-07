/**
 * Google Slides - Page Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSlidesV2PageGetNode } from './operation_get';
import type { GoogleSlidesV2PageGetThumbnailNode } from './operation_get_thumbnail';

export * from './operation_get';
export * from './operation_get_thumbnail';

export type GoogleSlidesV2PageNode =
  | GoogleSlidesV2PageGetNode
  | GoogleSlidesV2PageGetThumbnailNode
  ;