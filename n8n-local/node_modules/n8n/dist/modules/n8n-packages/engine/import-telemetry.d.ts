import type { EventService } from '@n8n/backend-services';
import type { CredentialBindingRequest } from '../entities/credential/credential.types';
import type { DataTableImportRequest } from '../entities/data-table/data-table.types';
import type { TagImportRequest } from '../entities/tag/tag.types';
import type { VariableImportRequest } from '../entities/variable/variable.types';
import type { ImportContext, ResolvedImportPackageRequest, ImportResult } from '../n8n-packages.types';
import type { ImportContentResult } from './import-orchestrator';
import type { PackageManifest } from '../spec/manifest.schema';
export interface PackageImportScope {
    context: ImportContext;
    imported: ImportContentResult;
    credentialRequest: CredentialBindingRequest;
    dataTableRequest: DataTableImportRequest;
    variableRequest: VariableImportRequest;
    tagRequest: TagImportRequest;
}
export interface ImportOutcome {
    result: ImportResult;
    scopes: PackageImportScope[];
}
export declare function emitPackageImportedEvent(eventService: EventService, params: {
    request: ResolvedImportPackageRequest;
    manifest: PackageManifest;
    scopes: PackageImportScope[];
}): void;
