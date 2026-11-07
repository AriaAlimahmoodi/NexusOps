import type { User } from '@n8n/db';
import { CredentialsFinderService } from '@n8n/backend-services';
import { CredentialSerializer } from './credential.serializer';
import type { CredentialRequirement } from './credential.types';
import type { PackageWriter } from '../../io/package-writer';
import type { CredentialExportPolicy } from '../../n8n-packages.types';
import type { ManifestEntry } from '../../spec/manifest.schema';
import type { PackageCredentialRequirement } from '../../spec/requirements.schema';
export interface CredentialExportRequest {
    user: User;
    requirements: CredentialRequirement[];
    writer: PackageWriter;
    credentialExportPolicy: CredentialExportPolicy;
    projectTargetsById?: Map<string, string>;
}
export interface CredentialExportResult {
    entries: ManifestEntry[];
    requirements: PackageCredentialRequirement[];
}
export declare class CredentialExporter {
    private readonly credentialsFinder;
    private readonly credentialSerializer;
    constructor(credentialsFinder: CredentialsFinderService, credentialSerializer: CredentialSerializer);
    export(request: CredentialExportRequest): Promise<CredentialExportResult>;
    private ownerProjectId;
    private groupByCredentialId;
}
