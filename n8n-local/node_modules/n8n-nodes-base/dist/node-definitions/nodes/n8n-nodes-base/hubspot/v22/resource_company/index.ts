/**
 * HubSpot - Company Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV22CompanyCreateNode } from './operation_create';
import type { HubspotV22CompanyDeleteNode } from './operation_delete';
import type { HubspotV22CompanyGetNode } from './operation_get';
import type { HubspotV22CompanyGetAllNode } from './operation_get_all';
import type { HubspotV22CompanyGetRecentlyCreatedUpdatedNode } from './operation_get_recently_created_updated';
import type { HubspotV22CompanySearchByDomainNode } from './operation_search_by_domain';
import type { HubspotV22CompanyUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_recently_created_updated';
export * from './operation_search_by_domain';
export * from './operation_update';

export type HubspotV22CompanyNode =
  | HubspotV22CompanyCreateNode
  | HubspotV22CompanyDeleteNode
  | HubspotV22CompanyGetNode
  | HubspotV22CompanyGetAllNode
  | HubspotV22CompanyGetRecentlyCreatedUpdatedNode
  | HubspotV22CompanySearchByDomainNode
  | HubspotV22CompanyUpdateNode
  ;