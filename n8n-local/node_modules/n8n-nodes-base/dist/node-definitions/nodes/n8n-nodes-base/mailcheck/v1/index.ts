/**
 * Mailcheck Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MailcheckV1EmailNode } from './resource_email';

export * from './resource_email';

export type MailcheckV1Node = MailcheckV1EmailNode;