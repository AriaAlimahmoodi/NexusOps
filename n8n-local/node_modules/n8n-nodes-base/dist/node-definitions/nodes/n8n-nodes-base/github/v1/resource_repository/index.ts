/**
 * GitHub - Repository Resource
 * Re-exports all operation types for this resource.
 */

import type { GithubV1RepositoryGetNode } from './operation_get';
import type { GithubV1RepositoryGetIssuesNode } from './operation_get_issues';
import type { GithubV1RepositoryGetLicenseNode } from './operation_get_license';
import type { GithubV1RepositoryGetProfileNode } from './operation_get_profile';
import type { GithubV1RepositoryGetPullRequestsNode } from './operation_get_pull_requests';
import type { GithubV1RepositoryListPopularPathsNode } from './operation_list_popular_paths';
import type { GithubV1RepositoryListReferrersNode } from './operation_list_referrers';

export * from './operation_get';
export * from './operation_get_issues';
export * from './operation_get_license';
export * from './operation_get_profile';
export * from './operation_get_pull_requests';
export * from './operation_list_popular_paths';
export * from './operation_list_referrers';

export type GithubV1RepositoryNode =
  | GithubV1RepositoryGetNode
  | GithubV1RepositoryGetIssuesNode
  | GithubV1RepositoryGetLicenseNode
  | GithubV1RepositoryGetProfileNode
  | GithubV1RepositoryGetPullRequestsNode
  | GithubV1RepositoryListPopularPathsNode
  | GithubV1RepositoryListReferrersNode
  ;