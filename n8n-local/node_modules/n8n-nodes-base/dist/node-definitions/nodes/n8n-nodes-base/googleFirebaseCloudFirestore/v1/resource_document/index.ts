/**
 * Google Cloud Firestore - Document Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleFirebaseCloudFirestoreV1DocumentCreateNode } from './operation_create';
import type { GoogleFirebaseCloudFirestoreV1DocumentDeleteNode } from './operation_delete';
import type { GoogleFirebaseCloudFirestoreV1DocumentGetNode } from './operation_get';
import type { GoogleFirebaseCloudFirestoreV1DocumentGetAllNode } from './operation_get_all';
import type { GoogleFirebaseCloudFirestoreV1DocumentQueryNode } from './operation_query';
import type { GoogleFirebaseCloudFirestoreV1DocumentUpsertNode } from './operation_upsert';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_query';
export * from './operation_upsert';

export type GoogleFirebaseCloudFirestoreV1DocumentNode =
  | GoogleFirebaseCloudFirestoreV1DocumentCreateNode
  | GoogleFirebaseCloudFirestoreV1DocumentDeleteNode
  | GoogleFirebaseCloudFirestoreV1DocumentGetNode
  | GoogleFirebaseCloudFirestoreV1DocumentGetAllNode
  | GoogleFirebaseCloudFirestoreV1DocumentQueryNode
  | GoogleFirebaseCloudFirestoreV1DocumentUpsertNode
  ;