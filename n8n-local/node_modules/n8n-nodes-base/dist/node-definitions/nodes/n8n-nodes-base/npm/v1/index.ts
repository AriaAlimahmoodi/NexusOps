/**
 * Npm Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { NpmV1PackageNode } from './resource_package';
import type { NpmV1DistTagNode } from './resource_dist_tag';

export * from './resource_package';
export * from './resource_dist_tag';

export type NpmV1Node =
  | NpmV1PackageNode
  | NpmV1DistTagNode
  ;