/**
 * Keap Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { KeapV1CompanyNode } from './resource_company';
import type { KeapV1ContactNode } from './resource_contact';
import type { KeapV1ContactNoteNode } from './resource_contact_note';
import type { KeapV1ContactTagNode } from './resource_contact_tag';
import type { KeapV1EcommerceOrderNode } from './resource_ecommerce_order';
import type { KeapV1EcommerceProductNode } from './resource_ecommerce_product';
import type { KeapV1EmailNode } from './resource_email';
import type { KeapV1FileNode } from './resource_file';

export * from './resource_company';
export * from './resource_contact';
export * from './resource_contact_note';
export * from './resource_contact_tag';
export * from './resource_ecommerce_order';
export * from './resource_ecommerce_product';
export * from './resource_email';
export * from './resource_file';

export type KeapV1Node =
  | KeapV1CompanyNode
  | KeapV1ContactNode
  | KeapV1ContactNoteNode
  | KeapV1ContactTagNode
  | KeapV1EcommerceOrderNode
  | KeapV1EcommerceProductNode
  | KeapV1EmailNode
  | KeapV1FileNode
  ;