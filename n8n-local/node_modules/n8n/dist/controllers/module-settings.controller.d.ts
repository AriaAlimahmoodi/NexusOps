import { FrontendService } from '../services/frontend.service';
export declare class ModuleSettingsController {
    private readonly frontendService;
    constructor(frontendService: FrontendService);
    getModuleSettings(): {
        [k: string]: import("@n8n/decorators").ModuleSettings;
    };
}
