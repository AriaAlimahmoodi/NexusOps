/**
 * Google Docs - Document Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleDocsV1DocumentCreateNode } from './operation_create';
import type { GoogleDocsV1DocumentGetNode } from './operation_get';
import type { GoogleDocsV1DocumentUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_update';

export type GoogleDocsV1DocumentNode =
  | GoogleDocsV1DocumentCreateNode
  | GoogleDocsV1DocumentGetNode
  | GoogleDocsV1DocumentUpdateNode
  ;