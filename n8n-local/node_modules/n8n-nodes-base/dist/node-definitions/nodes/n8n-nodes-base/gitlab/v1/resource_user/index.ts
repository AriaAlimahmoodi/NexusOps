/**
 * GitLab - User Resource
 * Re-exports all operation types for this resource.
 */

import type { GitlabV1UserGetRepositoriesNode } from './operation_get_repositories';

export * from './operation_get_repositories';

export type GitlabV1UserNode = GitlabV1UserGetRepositoriesNode;