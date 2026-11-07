/**
 * Freshservice - Announcement Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshserviceV1AnnouncementCreateNode } from './operation_create';
import type { FreshserviceV1AnnouncementDeleteNode } from './operation_delete';
import type { FreshserviceV1AnnouncementGetNode } from './operation_get';
import type { FreshserviceV1AnnouncementGetAllNode } from './operation_get_all';
import type { FreshserviceV1AnnouncementUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshserviceV1AnnouncementNode =
  | FreshserviceV1AnnouncementCreateNode
  | FreshserviceV1AnnouncementDeleteNode
  | FreshserviceV1AnnouncementGetNode
  | FreshserviceV1AnnouncementGetAllNode
  | FreshserviceV1AnnouncementUpdateNode
  ;