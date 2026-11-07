/**
 * Google Gemini - FileSearch Resource
 * Re-exports all operation types for this resource.
 */

import type { LcGoogleGeminiV12FileSearchCreateStoreNode } from './operation_create_store';
import type { LcGoogleGeminiV12FileSearchDeleteStoreNode } from './operation_delete_store';
import type { LcGoogleGeminiV12FileSearchListStoresNode } from './operation_list_stores';
import type { LcGoogleGeminiV12FileSearchUploadToStoreNode } from './operation_upload_to_store';

export * from './operation_create_store';
export * from './operation_delete_store';
export * from './operation_list_stores';
export * from './operation_upload_to_store';

export type LcGoogleGeminiV12FileSearchNode =
  | LcGoogleGeminiV12FileSearchCreateStoreNode
  | LcGoogleGeminiV12FileSearchDeleteStoreNode
  | LcGoogleGeminiV12FileSearchListStoresNode
  | LcGoogleGeminiV12FileSearchUploadToStoreNode
  ;