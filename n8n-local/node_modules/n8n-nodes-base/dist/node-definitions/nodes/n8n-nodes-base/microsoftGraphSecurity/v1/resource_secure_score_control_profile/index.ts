/**
 * Microsoft Graph Security - SecureScoreControlProfile Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftGraphSecurityV1SecureScoreControlProfileGetNode } from './operation_get';
import type { MicrosoftGraphSecurityV1SecureScoreControlProfileGetAllNode } from './operation_get_all';
import type { MicrosoftGraphSecurityV1SecureScoreControlProfileUpdateNode } from './operation_update';

export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MicrosoftGraphSecurityV1SecureScoreControlProfileNode =
  | MicrosoftGraphSecurityV1SecureScoreControlProfileGetNode
  | MicrosoftGraphSecurityV1SecureScoreControlProfileGetAllNode
  | MicrosoftGraphSecurityV1SecureScoreControlProfileUpdateNode
  ;