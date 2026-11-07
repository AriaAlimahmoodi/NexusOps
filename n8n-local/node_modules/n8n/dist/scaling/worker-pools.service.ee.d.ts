import { InstanceRegistryService } from '../modules/instance-registry/instance-registry.service';
export declare class WorkerPoolsService {
    private readonly instanceRegistryService;
    constructor(instanceRegistryService: InstanceRegistryService);
    getAvailablePools(): Promise<string[]>;
}
