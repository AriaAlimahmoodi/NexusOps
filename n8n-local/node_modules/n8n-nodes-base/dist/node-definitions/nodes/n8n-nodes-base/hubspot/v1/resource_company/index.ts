/**
 * HubSpot - Company Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV1CompanyCreateNode } from './operation_create';
import type { HubspotV1CompanyDeleteNode } from './operation_delete';
import type { HubspotV1CompanyGetNode } from './operation_get';
import type { HubspotV1CompanyGetAllNode } from './operation_get_all';
import type { HubspotV1CompanyGetRecentlyCreatedNode } from './operation_get_recently_created';
import type { HubspotV1CompanyGetRecentlyModifiedNode } from './operation_get_recently_modified';
import type { HubspotV1CompanySearchByDomainNode } from './operation_search_by_domain';
import type { HubspotV1CompanyUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_recently_created';
export * from './operation_get_recently_modified';
export * from './operation_search_by_domain';
export * from './operation_update';

export type HubspotV1CompanyNode =
  | HubspotV1CompanyCreateNode
  | HubspotV1CompanyDeleteNode
  | HubspotV1CompanyGetNode
  | HubspotV1CompanyGetAllNode
  | HubspotV1CompanyGetRecentlyCreatedNode
  | HubspotV1CompanyGetRecentlyModifiedNode
  | HubspotV1CompanySearchByDomainNode
  | HubspotV1CompanyUpdateNode
  ;