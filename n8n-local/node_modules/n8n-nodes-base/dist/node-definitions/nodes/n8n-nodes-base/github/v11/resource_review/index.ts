/**
 * GitHub - Review Resource
 * Re-exports all operation types for this resource.
 */

import type { GithubV11ReviewCreateNode } from './operation_create';
import type { GithubV11ReviewGetNode } from './operation_get';
import type { GithubV11ReviewGetAllNode } from './operation_get_all';
import type { GithubV11ReviewUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GithubV11ReviewNode =
  | GithubV11ReviewCreateNode
  | GithubV11ReviewGetNode
  | GithubV11ReviewGetAllNode
  | GithubV11ReviewUpdateNode
  ;