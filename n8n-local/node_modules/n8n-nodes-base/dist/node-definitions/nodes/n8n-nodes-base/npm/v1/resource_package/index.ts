/**
 * Npm - Package Resource
 * Re-exports all operation types for this resource.
 */

import type { NpmV1PackageGetMetadataNode } from './operation_get_metadata';
import type { NpmV1PackageGetVersionsNode } from './operation_get_versions';
import type { NpmV1PackageSearchNode } from './operation_search';

export * from './operation_get_metadata';
export * from './operation_get_versions';
export * from './operation_search';

export type NpmV1PackageNode =
  | NpmV1PackageGetMetadataNode
  | NpmV1PackageGetVersionsNode
  | NpmV1PackageSearchNode
  ;