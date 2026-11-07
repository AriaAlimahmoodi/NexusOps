/**
 * Zoom Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { ZoomV1MeetingNode } from './resource_meeting';

export * from './resource_meeting';

export type ZoomV1Node = ZoomV1MeetingNode;