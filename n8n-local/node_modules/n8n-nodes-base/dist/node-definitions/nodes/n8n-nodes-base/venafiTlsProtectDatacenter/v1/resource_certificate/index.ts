/**
 * Venafi TLS Protect Datacenter - Certificate Resource
 * Re-exports all operation types for this resource.
 */

import type { VenafiTlsProtectDatacenterV1CertificateCreateNode } from './operation_create';
import type { VenafiTlsProtectDatacenterV1CertificateDeleteNode } from './operation_delete';
import type { VenafiTlsProtectDatacenterV1CertificateDownloadNode } from './operation_download';
import type { VenafiTlsProtectDatacenterV1CertificateGetNode } from './operation_get';
import type { VenafiTlsProtectDatacenterV1CertificateGetManyNode } from './operation_get_many';
import type { VenafiTlsProtectDatacenterV1CertificateRenewNode } from './operation_renew';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_download';
export * from './operation_get';
export * from './operation_get_many';
export * from './operation_renew';

export type VenafiTlsProtectDatacenterV1CertificateNode =
  | VenafiTlsProtectDatacenterV1CertificateCreateNode
  | VenafiTlsProtectDatacenterV1CertificateDeleteNode
  | VenafiTlsProtectDatacenterV1CertificateDownloadNode
  | VenafiTlsProtectDatacenterV1CertificateGetNode
  | VenafiTlsProtectDatacenterV1CertificateGetManyNode
  | VenafiTlsProtectDatacenterV1CertificateRenewNode
  ;