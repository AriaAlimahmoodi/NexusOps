/**
 * Google Gemini - FileSearch Resource
 * Re-exports all operation types for this resource.
 */

import type { LcGoogleGeminiV11FileSearchCreateStoreNode } from './operation_create_store';
import type { LcGoogleGeminiV11FileSearchDeleteStoreNode } from './operation_delete_store';
import type { LcGoogleGeminiV11FileSearchListStoresNode } from './operation_list_stores';
import type { LcGoogleGeminiV11FileSearchUploadToStoreNode } from './operation_upload_to_store';

export * from './operation_create_store';
export * from './operation_delete_store';
export * from './operation_list_stores';
export * from './operation_upload_to_store';

export type LcGoogleGeminiV11FileSearchNode =
  | LcGoogleGeminiV11FileSearchCreateStoreNode
  | LcGoogleGeminiV11FileSearchDeleteStoreNode
  | LcGoogleGeminiV11FileSearchListStoresNode
  | LcGoogleGeminiV11FileSearchUploadToStoreNode
  ;