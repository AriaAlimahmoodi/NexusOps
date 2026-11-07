/**
 * Strava Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { StravaV1ActivityNode } from './resource_activity';

export * from './resource_activity';

export type StravaV1Node = StravaV1ActivityNode;