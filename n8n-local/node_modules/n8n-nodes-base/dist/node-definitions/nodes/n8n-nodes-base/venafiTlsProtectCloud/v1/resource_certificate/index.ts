/**
 * Venafi TLS Protect Cloud - Certificate Resource
 * Re-exports all operation types for this resource.
 */

import type { VenafiTlsProtectCloudV1CertificateDeleteNode } from './operation_delete';
import type { VenafiTlsProtectCloudV1CertificateDownloadNode } from './operation_download';
import type { VenafiTlsProtectCloudV1CertificateGetNode } from './operation_get';
import type { VenafiTlsProtectCloudV1CertificateGetManyNode } from './operation_get_many';
import type { VenafiTlsProtectCloudV1CertificateRenewNode } from './operation_renew';

export * from './operation_delete';
export * from './operation_download';
export * from './operation_get';
export * from './operation_get_many';
export * from './operation_renew';

export type VenafiTlsProtectCloudV1CertificateNode =
  | VenafiTlsProtectCloudV1CertificateDeleteNode
  | VenafiTlsProtectCloudV1CertificateDownloadNode
  | VenafiTlsProtectCloudV1CertificateGetNode
  | VenafiTlsProtectCloudV1CertificateGetManyNode
  | VenafiTlsProtectCloudV1CertificateRenewNode
  ;