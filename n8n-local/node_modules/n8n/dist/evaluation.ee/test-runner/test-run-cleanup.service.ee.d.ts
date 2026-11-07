import { Logger } from '@n8n/backend-common';
import { TestRunRepository } from '@n8n/db';
export declare class TestRunCleanupService {
    private readonly logger;
    private readonly testRunRepository;
    constructor(logger: Logger, testRunRepository: TestRunRepository);
    cleanupIncompleteRuns(): Promise<void>;
}
