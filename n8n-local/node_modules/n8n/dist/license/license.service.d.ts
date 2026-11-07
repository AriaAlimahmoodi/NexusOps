import { LicenseState, Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import { EventService, UrlService } from '@n8n/backend-services';
import type { User } from '@n8n/db';
import { WorkflowRepository } from '@n8n/db';
import { License } from '../license';
export declare const LicenseErrors: {
    SCHEMA_VALIDATION: string;
    RESERVATION_EXHAUSTED: string;
    RESERVATION_EXPIRED: string;
    NOT_FOUND: string;
    RESERVATION_CONFLICT: string;
    RESERVATION_DUPLICATE: string;
};
export declare class LicenseService {
    private readonly logger;
    private readonly license;
    private readonly licenseState;
    private readonly workflowRepository;
    private readonly urlService;
    private readonly eventService;
    private readonly http;
    constructor(logger: Logger, license: License, licenseState: LicenseState, workflowRepository: WorkflowRepository, urlService: UrlService, eventService: EventService, outboundHttp: OutboundHttp);
    getLicenseData(): Promise<{
        usage: {
            activeWorkflowTriggers: {
                value: number;
                limit: number;
                warningThreshold: number;
            };
            workflowsHavingEvaluations: {
                value: number;
                limit: number;
            };
        };
        license: {
            planId: string;
            planName: string;
        };
    }>;
    requestEnterpriseTrial(user: User): Promise<void>;
    registerCommunityEdition({ userId, email, instanceId, instanceUrl, licenseType, }: {
        userId: User['id'];
        email: string;
        instanceId: string;
        instanceUrl: string;
        licenseType: string;
    }): Promise<{
        title: string;
        text: string;
    }>;
    getManagementJwt(): string;
    activateLicense(activationKey: string): Promise<void>;
    activateLicense(activationKey: string, eulaUri: string, userEmail: string): Promise<void>;
    private isEulaRequiredError;
    renewLicense(): Promise<void>;
    private mapErrorMessage;
    private isLicenseError;
}
