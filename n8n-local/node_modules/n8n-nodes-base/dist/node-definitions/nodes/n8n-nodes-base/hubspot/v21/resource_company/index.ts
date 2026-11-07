/**
 * HubSpot - Company Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV21CompanyCreateNode } from './operation_create';
import type { HubspotV21CompanyDeleteNode } from './operation_delete';
import type { HubspotV21CompanyGetNode } from './operation_get';
import type { HubspotV21CompanyGetAllNode } from './operation_get_all';
import type { HubspotV21CompanyGetRecentlyCreatedUpdatedNode } from './operation_get_recently_created_updated';
import type { HubspotV21CompanySearchByDomainNode } from './operation_search_by_domain';
import type { HubspotV21CompanyUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_recently_created_updated';
export * from './operation_search_by_domain';
export * from './operation_update';

export type HubspotV21CompanyNode =
  | HubspotV21CompanyCreateNode
  | HubspotV21CompanyDeleteNode
  | HubspotV21CompanyGetNode
  | HubspotV21CompanyGetAllNode
  | HubspotV21CompanyGetRecentlyCreatedUpdatedNode
  | HubspotV21CompanySearchByDomainNode
  | HubspotV21CompanyUpdateNode
  ;