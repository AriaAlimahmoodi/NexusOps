/**
 * Twilio - Call Resource
 * Re-exports all operation types for this resource.
 */

import type { TwilioV1CallMakeNode } from './operation_make';

export * from './operation_make';

export type TwilioV1CallNode = TwilioV1CallMakeNode;