/**
 * Netlify - Deploy Resource
 * Re-exports all operation types for this resource.
 */

import type { NetlifyV1DeployCancelNode } from './operation_cancel';
import type { NetlifyV1DeployCreateNode } from './operation_create';
import type { NetlifyV1DeployGetNode } from './operation_get';
import type { NetlifyV1DeployGetAllNode } from './operation_get_all';

export * from './operation_cancel';
export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';

export type NetlifyV1DeployNode =
  | NetlifyV1DeployCancelNode
  | NetlifyV1DeployCreateNode
  | NetlifyV1DeployGetNode
  | NetlifyV1DeployGetAllNode
  ;