/**
 * Google Books - BookshelfVolume Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleBooksV2BookshelfVolumeAddNode } from './operation_add';
import type { GoogleBooksV2BookshelfVolumeClearNode } from './operation_clear';
import type { GoogleBooksV2BookshelfVolumeGetAllNode } from './operation_get_all';
import type { GoogleBooksV2BookshelfVolumeMoveNode } from './operation_move';
import type { GoogleBooksV2BookshelfVolumeRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_clear';
export * from './operation_get_all';
export * from './operation_move';
export * from './operation_remove';

export type GoogleBooksV2BookshelfVolumeNode =
  | GoogleBooksV2BookshelfVolumeAddNode
  | GoogleBooksV2BookshelfVolumeClearNode
  | GoogleBooksV2BookshelfVolumeGetAllNode
  | GoogleBooksV2BookshelfVolumeMoveNode
  | GoogleBooksV2BookshelfVolumeRemoveNode
  ;