/**
 * GitLab - Release Resource
 * Re-exports all operation types for this resource.
 */

import type { GitlabV1ReleaseCreateNode } from './operation_create';
import type { GitlabV1ReleaseDeleteNode } from './operation_delete';
import type { GitlabV1ReleaseGetNode } from './operation_get';
import type { GitlabV1ReleaseGetAllNode } from './operation_get_all';
import type { GitlabV1ReleaseUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GitlabV1ReleaseNode =
  | GitlabV1ReleaseCreateNode
  | GitlabV1ReleaseDeleteNode
  | GitlabV1ReleaseGetNode
  | GitlabV1ReleaseGetAllNode
  | GitlabV1ReleaseUpdateNode
  ;