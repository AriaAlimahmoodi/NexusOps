/**
 * Google Contacts - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleContactsV1ContactCreateNode } from './operation_create';
import type { GoogleContactsV1ContactDeleteNode } from './operation_delete';
import type { GoogleContactsV1ContactGetNode } from './operation_get';
import type { GoogleContactsV1ContactGetAllNode } from './operation_get_all';
import type { GoogleContactsV1ContactUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GoogleContactsV1ContactNode =
  | GoogleContactsV1ContactCreateNode
  | GoogleContactsV1ContactDeleteNode
  | GoogleContactsV1ContactGetNode
  | GoogleContactsV1ContactGetAllNode
  | GoogleContactsV1ContactUpdateNode
  ;