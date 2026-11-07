/**
 * RocketChat - Chat Resource
 * Re-exports all operation types for this resource.
 */

import type { RocketchatV1ChatPostMessageNode } from './operation_post_message';

export * from './operation_post_message';

export type RocketchatV1ChatNode = RocketchatV1ChatPostMessageNode;