import { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { ErrorReporter } from 'n8n-core';
import type { ICredentialsDecrypted, ICredentialTestFunction, ICredentialTestRequestData, INodeCredentialTestResult } from 'n8n-workflow';
import { CredentialTypes } from '../credential-types';
import { NodeTypes } from '../node-types';
import { CredentialsHelper } from '../credentials-helper';
export declare const AUTH_PROBE_ACCEPTED_MESSAGE = "The service accepted the credential.";
export type CredentialAuthProbeOutcome = 'accepted' | 'rejected' | 'unverified';
export type CredentialAuthProbeResult = INodeCredentialTestResult & {
    outcome: CredentialAuthProbeOutcome;
};
export declare class CredentialsTester {
    private readonly logger;
    private readonly errorReporter;
    private readonly credentialTypes;
    private readonly nodeTypes;
    private readonly credentialsHelper;
    constructor(logger: Logger, errorReporter: ErrorReporter, credentialTypes: CredentialTypes, nodeTypes: NodeTypes, credentialsHelper: CredentialsHelper);
    private static hasAccessToken;
    getCredentialTestFunction(credentialType: string): ICredentialTestFunction | ICredentialTestRequestData | undefined;
    private redactSecrets;
    private prepareCredentialsForTest;
    probeCredentialAuth(userId: User['id'], credentialType: string, credentialsDecrypted: ICredentialsDecrypted, targetUrl: string, options?: {
        acceptedStatusCodes?: number[];
        allowedDomains?: string;
    }): Promise<CredentialAuthProbeResult>;
    testCredentials(userId: User['id'], credentialType: string, credentialsDecrypted: ICredentialsDecrypted): Promise<INodeCredentialTestResult>;
    private resolveAuthProbeVerdict;
    private runRequestTest;
}
