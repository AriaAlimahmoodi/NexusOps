/**
 * Venafi TLS Protect Datacenter Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { VenafiTlsProtectDatacenterV1CertificateNode } from './resource_certificate';
import type { VenafiTlsProtectDatacenterV1PolicyNode } from './resource_policy';

export * from './resource_certificate';
export * from './resource_policy';

export type VenafiTlsProtectDatacenterV1Node =
  | VenafiTlsProtectDatacenterV1CertificateNode
  | VenafiTlsProtectDatacenterV1PolicyNode
  ;