/**
 * HaloPSA - Site Resource
 * Re-exports all operation types for this resource.
 */

import type { HaloPSAV1SiteCreateNode } from './operation_create';
import type { HaloPSAV1SiteDeleteNode } from './operation_delete';
import type { HaloPSAV1SiteGetNode } from './operation_get';
import type { HaloPSAV1SiteGetAllNode } from './operation_get_all';
import type { HaloPSAV1SiteUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type HaloPSAV1SiteNode =
  | HaloPSAV1SiteCreateNode
  | HaloPSAV1SiteDeleteNode
  | HaloPSAV1SiteGetNode
  | HaloPSAV1SiteGetAllNode
  | HaloPSAV1SiteUpdateNode
  ;