/**
 * GitLab - Repository Resource
 * Re-exports all operation types for this resource.
 */

import type { GitlabV1RepositoryGetNode } from './operation_get';
import type { GitlabV1RepositoryGetIssuesNode } from './operation_get_issues';

export * from './operation_get';
export * from './operation_get_issues';

export type GitlabV1RepositoryNode =
  | GitlabV1RepositoryGetNode
  | GitlabV1RepositoryGetIssuesNode
  ;