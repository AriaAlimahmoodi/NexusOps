/**
 * GitHub - Release Resource
 * Re-exports all operation types for this resource.
 */

import type { GithubV11ReleaseCreateNode } from './operation_create';
import type { GithubV11ReleaseDeleteNode } from './operation_delete';
import type { GithubV11ReleaseGetNode } from './operation_get';
import type { GithubV11ReleaseGetAllNode } from './operation_get_all';
import type { GithubV11ReleaseUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GithubV11ReleaseNode =
  | GithubV11ReleaseCreateNode
  | GithubV11ReleaseDeleteNode
  | GithubV11ReleaseGetNode
  | GithubV11ReleaseGetAllNode
  | GithubV11ReleaseUpdateNode
  ;