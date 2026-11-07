/**
 * Google Cloud Firestore Node - Version 1.1
 * Re-exports all discriminator combinations.
 */

import type { GoogleFirebaseCloudFirestoreV11DocumentNode } from './resource_document';
import type { GoogleFirebaseCloudFirestoreV11CollectionNode } from './resource_collection';

export * from './resource_document';
export * from './resource_collection';

export type GoogleFirebaseCloudFirestoreV11Node =
  | GoogleFirebaseCloudFirestoreV11DocumentNode
  | GoogleFirebaseCloudFirestoreV11CollectionNode
  ;