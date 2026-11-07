import type { ClusterInfoResponse } from '@n8n/api-types';
import { CheckService } from './checks/check.service';
import { InstanceRegistryService } from './instance-registry.service';
export declare class InstanceRegistryController {
    private readonly instanceRegistryService;
    private readonly checkService;
    constructor(instanceRegistryService: InstanceRegistryService, checkService: CheckService);
    getClusterInfo(): Promise<ClusterInfoResponse>;
}
