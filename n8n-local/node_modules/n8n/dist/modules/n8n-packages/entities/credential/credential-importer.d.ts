import { CredentialsFinderService } from '@n8n/backend-services';
import { CredentialsService } from '../../../../credentials/credentials.service';
import { CredentialMatcherFactory } from './credential-matcher-factory';
import type { CredentialApplyResult, CredentialBindingRequest, CredentialImportPlan, CredentialResolution, CredentialResolutionFailure } from './credential.types';
import type { ImportContext } from '../../n8n-packages.types';
export declare class CredentialImporter {
    private readonly credentialMatcherFactory;
    private readonly credentialsService;
    private readonly credentialsFinder;
    constructor(credentialMatcherFactory: CredentialMatcherFactory, credentialsService: CredentialsService, credentialsFinder: CredentialsFinderService);
    plan(context: ImportContext, request: CredentialBindingRequest): Promise<CredentialImportPlan>;
    private planUpdates;
    blockingFailures(request: CredentialBindingRequest, resolution: CredentialResolution): CredentialResolutionFailure[];
    assertCanCreate(context: ImportContext, request: CredentialBindingRequest, resolution: CredentialResolution): Promise<void>;
    apply(context: ImportContext, request: CredentialBindingRequest, resolution: CredentialResolution): Promise<CredentialApplyResult>;
}
