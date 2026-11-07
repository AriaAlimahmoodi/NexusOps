import { Logger } from '@n8n/backend-common';
import type { Migration } from './migrations/node-migration';
export declare class MigrationRegistry {
    private readonly logger;
    private readonly migrations;
    constructor(logger: Logger);
    registerAll(): void;
    get(ruleId: string): Migration | undefined;
    has(ruleId: string): boolean;
}
