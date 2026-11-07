/**
 * Plivo Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { PlivoV1CallNode } from './resource_call';
import type { PlivoV1MmsNode } from './resource_mms';
import type { PlivoV1SmsNode } from './resource_sms';

export * from './resource_call';
export * from './resource_mms';
export * from './resource_sms';

export type PlivoV1Node =
  | PlivoV1CallNode
  | PlivoV1MmsNode
  | PlivoV1SmsNode
  ;