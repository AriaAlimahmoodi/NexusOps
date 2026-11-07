/**
 * Google Books - Volume Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleBooksV1VolumeGetNode } from './operation_get';
import type { GoogleBooksV1VolumeGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type GoogleBooksV1VolumeNode =
  | GoogleBooksV1VolumeGetNode
  | GoogleBooksV1VolumeGetAllNode
  ;