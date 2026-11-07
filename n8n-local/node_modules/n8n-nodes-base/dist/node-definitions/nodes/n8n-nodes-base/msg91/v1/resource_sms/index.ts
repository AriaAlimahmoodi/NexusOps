/**
 * MSG91 - Sms Resource
 * Re-exports all operation types for this resource.
 */

import type { Msg91V1SmsSendNode } from './operation_send';

export * from './operation_send';

export type Msg91V1SmsNode = Msg91V1SmsSendNode;