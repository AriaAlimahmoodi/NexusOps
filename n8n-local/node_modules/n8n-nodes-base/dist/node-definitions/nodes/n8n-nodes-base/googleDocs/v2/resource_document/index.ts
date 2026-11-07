/**
 * Google Docs - Document Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleDocsV2DocumentCreateNode } from './operation_create';
import type { GoogleDocsV2DocumentGetNode } from './operation_get';
import type { GoogleDocsV2DocumentUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_update';

export type GoogleDocsV2DocumentNode =
  | GoogleDocsV2DocumentCreateNode
  | GoogleDocsV2DocumentGetNode
  | GoogleDocsV2DocumentUpdateNode
  ;