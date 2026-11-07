/**
 * Vonage Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { VonageV1SmsNode } from './resource_sms';

export * from './resource_sms';

export type VonageV1Node = VonageV1SmsNode;