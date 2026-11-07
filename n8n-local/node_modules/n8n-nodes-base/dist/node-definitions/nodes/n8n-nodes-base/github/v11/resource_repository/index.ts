/**
 * GitHub - Repository Resource
 * Re-exports all operation types for this resource.
 */

import type { GithubV11RepositoryGetNode } from './operation_get';
import type { GithubV11RepositoryGetIssuesNode } from './operation_get_issues';
import type { GithubV11RepositoryGetLicenseNode } from './operation_get_license';
import type { GithubV11RepositoryGetProfileNode } from './operation_get_profile';
import type { GithubV11RepositoryGetPullRequestsNode } from './operation_get_pull_requests';
import type { GithubV11RepositoryListPopularPathsNode } from './operation_list_popular_paths';
import type { GithubV11RepositoryListReferrersNode } from './operation_list_referrers';

export * from './operation_get';
export * from './operation_get_issues';
export * from './operation_get_license';
export * from './operation_get_profile';
export * from './operation_get_pull_requests';
export * from './operation_list_popular_paths';
export * from './operation_list_referrers';

export type GithubV11RepositoryNode =
  | GithubV11RepositoryGetNode
  | GithubV11RepositoryGetIssuesNode
  | GithubV11RepositoryGetLicenseNode
  | GithubV11RepositoryGetProfileNode
  | GithubV11RepositoryGetPullRequestsNode
  | GithubV11RepositoryListPopularPathsNode
  | GithubV11RepositoryListReferrersNode
  ;