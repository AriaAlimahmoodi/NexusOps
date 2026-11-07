import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddInputsOutputsToTestCaseExecution1752669793000 implements ReversibleMigration {
    up({ schemaBuilder: { addColumns, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropColumns } }: MigrationContext): Promise<void>;
}
