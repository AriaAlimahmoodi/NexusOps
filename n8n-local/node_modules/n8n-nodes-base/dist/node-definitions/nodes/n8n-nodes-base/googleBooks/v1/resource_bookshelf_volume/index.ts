/**
 * Google Books - BookshelfVolume Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleBooksV1BookshelfVolumeAddNode } from './operation_add';
import type { GoogleBooksV1BookshelfVolumeClearNode } from './operation_clear';
import type { GoogleBooksV1BookshelfVolumeGetAllNode } from './operation_get_all';
import type { GoogleBooksV1BookshelfVolumeMoveNode } from './operation_move';
import type { GoogleBooksV1BookshelfVolumeRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_clear';
export * from './operation_get_all';
export * from './operation_move';
export * from './operation_remove';

export type GoogleBooksV1BookshelfVolumeNode =
  | GoogleBooksV1BookshelfVolumeAddNode
  | GoogleBooksV1BookshelfVolumeClearNode
  | GoogleBooksV1BookshelfVolumeGetAllNode
  | GoogleBooksV1BookshelfVolumeMoveNode
  | GoogleBooksV1BookshelfVolumeRemoveNode
  ;