/**
 * Google Slides - Page Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSlidesV1PageGetNode } from './operation_get';
import type { GoogleSlidesV1PageGetThumbnailNode } from './operation_get_thumbnail';

export * from './operation_get';
export * from './operation_get_thumbnail';

export type GoogleSlidesV1PageNode =
  | GoogleSlidesV1PageGetNode
  | GoogleSlidesV1PageGetThumbnailNode
  ;