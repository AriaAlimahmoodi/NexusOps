/**
 * Netlify Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { NetlifyV1DeployNode } from './resource_deploy';
import type { NetlifyV1SiteNode } from './resource_site';

export * from './resource_deploy';
export * from './resource_site';

export type NetlifyV1Node =
  | NetlifyV1DeployNode
  | NetlifyV1SiteNode
  ;