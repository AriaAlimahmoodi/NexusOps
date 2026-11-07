import type { AuthenticatedRequest } from '@n8n/db';
import { License } from '../license';
import { WorkerStatusService } from '../scaling/worker-status.service.ee';
export declare class OrchestrationController {
    private readonly licenseService;
    private readonly workerStatusService;
    constructor(licenseService: License, workerStatusService: WorkerStatusService);
    getWorkersStatusAll(req: AuthenticatedRequest): Promise<void>;
}
