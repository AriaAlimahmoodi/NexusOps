/**
 * Microsoft Graph Security - SecureScore Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftGraphSecurityV1SecureScoreGetNode } from './operation_get';
import type { MicrosoftGraphSecurityV1SecureScoreGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type MicrosoftGraphSecurityV1SecureScoreNode =
  | MicrosoftGraphSecurityV1SecureScoreGetNode
  | MicrosoftGraphSecurityV1SecureScoreGetAllNode
  ;