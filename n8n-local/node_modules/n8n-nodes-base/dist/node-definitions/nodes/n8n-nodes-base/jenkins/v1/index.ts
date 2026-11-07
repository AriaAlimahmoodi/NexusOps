/**
 * Jenkins Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { JenkinsV1BuildNode } from './resource_build';
import type { JenkinsV1InstanceNode } from './resource_instance';
import type { JenkinsV1JobNode } from './resource_job';

export * from './resource_build';
export * from './resource_instance';
export * from './resource_job';

export type JenkinsV1Node =
  | JenkinsV1BuildNode
  | JenkinsV1InstanceNode
  | JenkinsV1JobNode
  ;