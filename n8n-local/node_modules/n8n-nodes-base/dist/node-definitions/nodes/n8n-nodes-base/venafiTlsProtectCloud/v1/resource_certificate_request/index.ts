/**
 * Venafi TLS Protect Cloud - CertificateRequest Resource
 * Re-exports all operation types for this resource.
 */

import type { VenafiTlsProtectCloudV1CertificateRequestCreateNode } from './operation_create';
import type { VenafiTlsProtectCloudV1CertificateRequestGetNode } from './operation_get';
import type { VenafiTlsProtectCloudV1CertificateRequestGetManyNode } from './operation_get_many';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_many';

export type VenafiTlsProtectCloudV1CertificateRequestNode =
  | VenafiTlsProtectCloudV1CertificateRequestCreateNode
  | VenafiTlsProtectCloudV1CertificateRequestGetNode
  | VenafiTlsProtectCloudV1CertificateRequestGetManyNode
  ;