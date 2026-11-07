/**
 * Okta Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { OktaV1UserNode } from './resource_user';

export * from './resource_user';

export type OktaV1Node = OktaV1UserNode;