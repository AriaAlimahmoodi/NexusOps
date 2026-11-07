/**
 * Microsoft Graph Security Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MicrosoftGraphSecurityV1SecureScoreNode } from './resource_secure_score';
import type { MicrosoftGraphSecurityV1SecureScoreControlProfileNode } from './resource_secure_score_control_profile';

export * from './resource_secure_score';
export * from './resource_secure_score_control_profile';

export type MicrosoftGraphSecurityV1Node =
  | MicrosoftGraphSecurityV1SecureScoreNode
  | MicrosoftGraphSecurityV1SecureScoreControlProfileNode
  ;