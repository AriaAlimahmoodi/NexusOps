/**
 * Xero Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { XeroV1ContactNode } from './resource_contact';
import type { XeroV1InvoiceNode } from './resource_invoice';

export * from './resource_contact';
export * from './resource_invoice';

export type XeroV1Node =
  | XeroV1ContactNode
  | XeroV1InvoiceNode
  ;