/**
 * Google Books - Volume Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleBooksV2VolumeGetNode } from './operation_get';
import type { GoogleBooksV2VolumeGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type GoogleBooksV2VolumeNode =
  | GoogleBooksV2VolumeGetNode
  | GoogleBooksV2VolumeGetAllNode
  ;