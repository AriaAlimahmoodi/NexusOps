/**
 * Google Cloud Firestore - Document Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleFirebaseCloudFirestoreV11DocumentCreateNode } from './operation_create';
import type { GoogleFirebaseCloudFirestoreV11DocumentDeleteNode } from './operation_delete';
import type { GoogleFirebaseCloudFirestoreV11DocumentGetNode } from './operation_get';
import type { GoogleFirebaseCloudFirestoreV11DocumentGetAllNode } from './operation_get_all';
import type { GoogleFirebaseCloudFirestoreV11DocumentQueryNode } from './operation_query';
import type { GoogleFirebaseCloudFirestoreV11DocumentUpsertNode } from './operation_upsert';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_query';
export * from './operation_upsert';

export type GoogleFirebaseCloudFirestoreV11DocumentNode =
  | GoogleFirebaseCloudFirestoreV11DocumentCreateNode
  | GoogleFirebaseCloudFirestoreV11DocumentDeleteNode
  | GoogleFirebaseCloudFirestoreV11DocumentGetNode
  | GoogleFirebaseCloudFirestoreV11DocumentGetAllNode
  | GoogleFirebaseCloudFirestoreV11DocumentQueryNode
  | GoogleFirebaseCloudFirestoreV11DocumentUpsertNode
  ;