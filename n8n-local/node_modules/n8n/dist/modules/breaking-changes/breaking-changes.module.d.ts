import type { ModuleInterface } from '@n8n/decorators';
export declare class BreakingChangesModule implements ModuleInterface {
    init(): Promise<void>;
    entities(): Promise<(typeof import("./database/entities/migration-finding.entity.js").MigrationFinding | typeof import("./database/entities/migration-workflow-owner.entity.js").MigrationWorkflowOwner | typeof import("./database/entities/migration-finding-sync.entity.js").MigrationFindingSync)[]>;
}
