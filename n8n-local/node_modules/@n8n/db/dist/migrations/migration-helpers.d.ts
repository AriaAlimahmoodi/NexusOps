import type { QueryRunner } from '@n8n/typeorm/query-runner/QueryRunner';
import type { Migration } from './migration-types';
export declare const copyTable: (queryRunner: QueryRunner, tablePrefix: string, fromTable: string, toTable: string, fromFields?: string[], toFields?: string[], batchSize?: number) => Promise<void>;
export declare const wrapMigration: (migration: Migration) => void;
