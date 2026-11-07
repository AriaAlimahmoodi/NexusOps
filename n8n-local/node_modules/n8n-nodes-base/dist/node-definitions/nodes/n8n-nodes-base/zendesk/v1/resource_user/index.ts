/**
 * Zendesk - User Resource
 * Re-exports all operation types for this resource.
 */

import type { ZendeskV1UserCreateNode } from './operation_create';
import type { ZendeskV1UserDeleteNode } from './operation_delete';
import type { ZendeskV1UserGetNode } from './operation_get';
import type { ZendeskV1UserGetAllNode } from './operation_get_all';
import type { ZendeskV1UserGetOrganizationsNode } from './operation_get_organizations';
import type { ZendeskV1UserGetRelatedDataNode } from './operation_get_related_data';
import type { ZendeskV1UserSearchNode } from './operation_search';
import type { ZendeskV1UserUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_organizations';
export * from './operation_get_related_data';
export * from './operation_search';
export * from './operation_update';

export type ZendeskV1UserNode =
  | ZendeskV1UserCreateNode
  | ZendeskV1UserDeleteNode
  | ZendeskV1UserGetNode
  | ZendeskV1UserGetAllNode
  | ZendeskV1UserGetOrganizationsNode
  | ZendeskV1UserGetRelatedDataNode
  | ZendeskV1UserSearchNode
  | ZendeskV1UserUpdateNode
  ;