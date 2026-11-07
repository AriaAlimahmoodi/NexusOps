/**
 * Mocean - Voice Resource
 * Re-exports all operation types for this resource.
 */

import type { MoceanV1VoiceSendNode } from './operation_send';

export * from './operation_send';

export type MoceanV1VoiceNode = MoceanV1VoiceSendNode;