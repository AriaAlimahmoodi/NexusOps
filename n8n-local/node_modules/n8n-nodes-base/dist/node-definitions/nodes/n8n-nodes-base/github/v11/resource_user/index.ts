/**
 * GitHub - User Resource
 * Re-exports all operation types for this resource.
 */

import type { GithubV11UserGetRepositoriesNode } from './operation_get_repositories';
import type { GithubV11UserGetUserIssuesNode } from './operation_get_user_issues';
import type { GithubV11UserInviteNode } from './operation_invite';

export * from './operation_get_repositories';
export * from './operation_get_user_issues';
export * from './operation_invite';

export type GithubV11UserNode =
  | GithubV11UserGetRepositoriesNode
  | GithubV11UserGetUserIssuesNode
  | GithubV11UserInviteNode
  ;