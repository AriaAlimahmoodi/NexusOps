/**
 * Google Cloud Firestore Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { GoogleFirebaseCloudFirestoreV1DocumentNode } from './resource_document';
import type { GoogleFirebaseCloudFirestoreV1CollectionNode } from './resource_collection';

export * from './resource_document';
export * from './resource_collection';

export type GoogleFirebaseCloudFirestoreV1Node =
  | GoogleFirebaseCloudFirestoreV1DocumentNode
  | GoogleFirebaseCloudFirestoreV1CollectionNode
  ;