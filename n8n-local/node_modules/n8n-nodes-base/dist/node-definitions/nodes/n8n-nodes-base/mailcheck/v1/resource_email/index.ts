/**
 * Mailcheck - Email Resource
 * Re-exports all operation types for this resource.
 */

import type { MailcheckV1EmailCheckNode } from './operation_check';

export * from './operation_check';

export type MailcheckV1EmailNode = MailcheckV1EmailCheckNode;