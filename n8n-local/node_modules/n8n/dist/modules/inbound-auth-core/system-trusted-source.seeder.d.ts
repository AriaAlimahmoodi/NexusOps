import { Logger } from '@n8n/backend-common';
import { UrlService } from '@n8n/backend-services';
import { TrustedSourceDbStore } from './trusted-source.store';
export declare class SystemTrustedSourceSeeder {
    private readonly store;
    private readonly urlService;
    private readonly logger;
    constructor(store: TrustedSourceDbStore, urlService: UrlService, logger: Logger);
    seed(): Promise<void>;
}
