/**
 * Zendesk - Organization Resource
 * Re-exports all operation types for this resource.
 */

import type { ZendeskV1OrganizationCountNode } from './operation_count';
import type { ZendeskV1OrganizationCreateNode } from './operation_create';
import type { ZendeskV1OrganizationDeleteNode } from './operation_delete';
import type { ZendeskV1OrganizationGetNode } from './operation_get';
import type { ZendeskV1OrganizationGetAllNode } from './operation_get_all';
import type { ZendeskV1OrganizationGetRelatedDataNode } from './operation_get_related_data';
import type { ZendeskV1OrganizationUpdateNode } from './operation_update';

export * from './operation_count';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_related_data';
export * from './operation_update';

export type ZendeskV1OrganizationNode =
  | ZendeskV1OrganizationCountNode
  | ZendeskV1OrganizationCreateNode
  | ZendeskV1OrganizationDeleteNode
  | ZendeskV1OrganizationGetNode
  | ZendeskV1OrganizationGetAllNode
  | ZendeskV1OrganizationGetRelatedDataNode
  | ZendeskV1OrganizationUpdateNode
  ;