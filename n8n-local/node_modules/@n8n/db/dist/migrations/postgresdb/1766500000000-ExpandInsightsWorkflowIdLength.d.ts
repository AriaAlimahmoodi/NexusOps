import type { IrreversibleMigration, MigrationContext } from '../migration-types';
export declare class ExpandInsightsWorkflowIdLength1766500000000 implements IrreversibleMigration {
    up({ escape, queryRunner }: MigrationContext): Promise<void>;
}
