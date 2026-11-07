/**
 * Netlify - Site Resource
 * Re-exports all operation types for this resource.
 */

import type { NetlifyV1SiteDeleteNode } from './operation_delete';
import type { NetlifyV1SiteGetNode } from './operation_get';
import type { NetlifyV1SiteGetAllNode } from './operation_get_all';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type NetlifyV1SiteNode =
  | NetlifyV1SiteDeleteNode
  | NetlifyV1SiteGetNode
  | NetlifyV1SiteGetAllNode
  ;