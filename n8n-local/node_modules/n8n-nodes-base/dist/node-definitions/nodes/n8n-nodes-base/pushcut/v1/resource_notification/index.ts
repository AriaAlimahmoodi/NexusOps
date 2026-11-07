/**
 * Pushcut - Notification Resource
 * Re-exports all operation types for this resource.
 */

import type { PushcutV1NotificationSendNode } from './operation_send';

export * from './operation_send';

export type PushcutV1NotificationNode = PushcutV1NotificationSendNode;