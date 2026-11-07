/**
 * Flow Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { FlowV1TaskNode } from './resource_task';

export * from './resource_task';

export type FlowV1Node = FlowV1TaskNode;