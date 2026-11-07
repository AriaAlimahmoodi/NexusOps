import { CommunityRegisteredRequestDto } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import { InstanceSettings } from 'n8n-core';
import { LicenseRequest } from '../requests';
import { UrlService } from '@n8n/backend-services';
import { LicenseService } from './license.service';
export declare class LicenseController {
    private readonly licenseService;
    private readonly instanceSettings;
    private readonly urlService;
    constructor(licenseService: LicenseService, instanceSettings: InstanceSettings, urlService: UrlService);
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
    requestEnterpriseTrial(req: AuthenticatedRequest): Promise<void>;
    registerCommunityEdition(req: AuthenticatedRequest, _res: Response, payload: CommunityRegisteredRequestDto): Promise<{
        title: string;
        text: string;
    }>;
    activateLicense(req: LicenseRequest.Activate): Promise<{
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
        managementToken: string;
    }>;
    renewLicense(): Promise<{
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
        managementToken: string;
    }>;
    private getTokenAndData;
}
