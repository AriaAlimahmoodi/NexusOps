/**
 * Currents Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { CurrentsV1ActionNode } from './resource_action';
import type { CurrentsV1InstanceNode } from './resource_instance';
import type { CurrentsV1ProjectNode } from './resource_project';
import type { CurrentsV1RunNode } from './resource_run';
import type { CurrentsV1SignatureNode } from './resource_signature';
import type { CurrentsV1SpecFileNode } from './resource_spec_file';
import type { CurrentsV1TestNode } from './resource_test';
import type { CurrentsV1TestResultNode } from './resource_test_result';

export * from './resource_action';
export * from './resource_instance';
export * from './resource_project';
export * from './resource_run';
export * from './resource_signature';
export * from './resource_spec_file';
export * from './resource_test';
export * from './resource_test_result';

export type CurrentsV1Node =
  | CurrentsV1ActionNode
  | CurrentsV1InstanceNode
  | CurrentsV1ProjectNode
  | CurrentsV1RunNode
  | CurrentsV1SignatureNode
  | CurrentsV1SpecFileNode
  | CurrentsV1TestNode
  | CurrentsV1TestResultNode
  ;