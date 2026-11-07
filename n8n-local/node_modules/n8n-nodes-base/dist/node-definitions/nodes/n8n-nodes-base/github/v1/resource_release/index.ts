/**
 * GitHub - Release Resource
 * Re-exports all operation types for this resource.
 */

import type { GithubV1ReleaseCreateNode } from './operation_create';
import type { GithubV1ReleaseDeleteNode } from './operation_delete';
import type { GithubV1ReleaseGetNode } from './operation_get';
import type { GithubV1ReleaseGetAllNode } from './operation_get_all';
import type { GithubV1ReleaseUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GithubV1ReleaseNode =
  | GithubV1ReleaseCreateNode
  | GithubV1ReleaseDeleteNode
  | GithubV1ReleaseGetNode
  | GithubV1ReleaseGetAllNode
  | GithubV1ReleaseUpdateNode
  ;