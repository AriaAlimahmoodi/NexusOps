/**
 * seven - Voice Resource
 * Re-exports all operation types for this resource.
 */

import type { Sms77V1VoiceSendNode } from './operation_send';

export * from './operation_send';

export type Sms77V1VoiceNode = Sms77V1VoiceSendNode;