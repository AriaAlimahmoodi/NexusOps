/**
 * HubSpot - Company Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV2CompanyCreateNode } from './operation_create';
import type { HubspotV2CompanyDeleteNode } from './operation_delete';
import type { HubspotV2CompanyGetNode } from './operation_get';
import type { HubspotV2CompanyGetAllNode } from './operation_get_all';
import type { HubspotV2CompanyGetRecentlyCreatedUpdatedNode } from './operation_get_recently_created_updated';
import type { HubspotV2CompanySearchByDomainNode } from './operation_search_by_domain';
import type { HubspotV2CompanyUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_recently_created_updated';
export * from './operation_search_by_domain';
export * from './operation_update';

export type HubspotV2CompanyNode =
  | HubspotV2CompanyCreateNode
  | HubspotV2CompanyDeleteNode
  | HubspotV2CompanyGetNode
  | HubspotV2CompanyGetAllNode
  | HubspotV2CompanyGetRecentlyCreatedUpdatedNode
  | HubspotV2CompanySearchByDomainNode
  | HubspotV2CompanyUpdateNode
  ;