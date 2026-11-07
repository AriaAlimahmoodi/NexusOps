/**
 * Venafi TLS Protect Cloud Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { VenafiTlsProtectCloudV1CertificateNode } from './resource_certificate';
import type { VenafiTlsProtectCloudV1CertificateRequestNode } from './resource_certificate_request';

export * from './resource_certificate';
export * from './resource_certificate_request';

export type VenafiTlsProtectCloudV1Node =
  | VenafiTlsProtectCloudV1CertificateNode
  | VenafiTlsProtectCloudV1CertificateRequestNode
  ;