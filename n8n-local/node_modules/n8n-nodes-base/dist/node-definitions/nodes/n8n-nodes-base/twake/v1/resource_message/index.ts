/**
 * Twake - Message Resource
 * Re-exports all operation types for this resource.
 */

import type { TwakeV1MessageSendNode } from './operation_send';

export * from './operation_send';

export type TwakeV1MessageNode = TwakeV1MessageSendNode;