/**
 * Pipedrive - Organization Resource
 * Re-exports all operation types for this resource.
 */

import type { PipedriveV1OrganizationCreateNode } from './operation_create';
import type { PipedriveV1OrganizationDeleteNode } from './operation_delete';
import type { PipedriveV1OrganizationGetNode } from './operation_get';
import type { PipedriveV1OrganizationGetAllNode } from './operation_get_all';
import type { PipedriveV1OrganizationSearchNode } from './operation_search';
import type { PipedriveV1OrganizationUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_search';
export * from './operation_update';

export type PipedriveV1OrganizationNode =
  | PipedriveV1OrganizationCreateNode
  | PipedriveV1OrganizationDeleteNode
  | PipedriveV1OrganizationGetNode
  | PipedriveV1OrganizationGetAllNode
  | PipedriveV1OrganizationSearchNode
  | PipedriveV1OrganizationUpdateNode
  ;