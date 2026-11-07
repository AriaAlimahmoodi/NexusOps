/**
 * GitHub - User Resource
 * Re-exports all operation types for this resource.
 */

import type { GithubV1UserGetRepositoriesNode } from './operation_get_repositories';
import type { GithubV1UserGetUserIssuesNode } from './operation_get_user_issues';
import type { GithubV1UserInviteNode } from './operation_invite';

export * from './operation_get_repositories';
export * from './operation_get_user_issues';
export * from './operation_invite';

export type GithubV1UserNode =
  | GithubV1UserGetRepositoriesNode
  | GithubV1UserGetUserIssuesNode
  | GithubV1UserInviteNode
  ;