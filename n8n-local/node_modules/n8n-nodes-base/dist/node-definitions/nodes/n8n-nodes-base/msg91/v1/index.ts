/**
 * MSG91 Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { Msg91V1SmsNode } from './resource_sms';

export * from './resource_sms';

export type Msg91V1Node = Msg91V1SmsNode;