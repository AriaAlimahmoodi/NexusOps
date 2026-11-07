/**
 * GitHub - Review Resource
 * Re-exports all operation types for this resource.
 */

import type { GithubV1ReviewCreateNode } from './operation_create';
import type { GithubV1ReviewGetNode } from './operation_get';
import type { GithubV1ReviewGetAllNode } from './operation_get_all';
import type { GithubV1ReviewUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GithubV1ReviewNode =
  | GithubV1ReviewCreateNode
  | GithubV1ReviewGetNode
  | GithubV1ReviewGetAllNode
  | GithubV1ReviewUpdateNode
  ;