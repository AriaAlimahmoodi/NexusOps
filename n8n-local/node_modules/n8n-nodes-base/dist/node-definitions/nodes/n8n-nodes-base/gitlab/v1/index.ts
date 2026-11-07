/**
 * GitLab Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { GitlabV1FileNode } from './resource_file';
import type { GitlabV1IssueNode } from './resource_issue';
import type { GitlabV1ReleaseNode } from './resource_release';
import type { GitlabV1RepositoryNode } from './resource_repository';
import type { GitlabV1UserNode } from './resource_user';

export * from './resource_file';
export * from './resource_issue';
export * from './resource_release';
export * from './resource_repository';
export * from './resource_user';

export type GitlabV1Node =
  | GitlabV1FileNode
  | GitlabV1IssueNode
  | GitlabV1ReleaseNode
  | GitlabV1RepositoryNode
  | GitlabV1UserNode
  ;