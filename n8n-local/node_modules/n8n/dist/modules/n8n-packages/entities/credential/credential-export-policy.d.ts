import type { ICredentialDataDecryptedObject } from 'n8n-workflow';
import type { CredentialExportPolicy } from '../../n8n-packages.types';
import type { SerializedCredentialData } from '../../spec/serialized/credential.schema';
export declare function selectCredentialDataForExport(policy: CredentialExportPolicy, getDecryptedData: () => Promise<ICredentialDataDecryptedObject>): Promise<SerializedCredentialData | undefined>;
