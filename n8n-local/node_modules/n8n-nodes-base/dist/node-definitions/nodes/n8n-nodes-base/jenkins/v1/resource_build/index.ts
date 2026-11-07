/**
 * Jenkins - Build Resource
 * Re-exports all operation types for this resource.
 */

import type { JenkinsV1BuildGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type JenkinsV1BuildNode = JenkinsV1BuildGetAllNode;