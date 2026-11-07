/**
 * SecurityScorecard - Invite Resource
 * Re-exports all operation types for this resource.
 */

import type { SecurityScorecardV1InviteCreateNode } from './operation_create';

export * from './operation_create';

export type SecurityScorecardV1InviteNode = SecurityScorecardV1InviteCreateNode;