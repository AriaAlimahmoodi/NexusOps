/**
 * Mautic - SegmentEmail Resource
 * Re-exports all operation types for this resource.
 */

import type { MauticV1SegmentEmailSendNode } from './operation_send';

export * from './operation_send';

export type MauticV1SegmentEmailNode = MauticV1SegmentEmailSendNode;