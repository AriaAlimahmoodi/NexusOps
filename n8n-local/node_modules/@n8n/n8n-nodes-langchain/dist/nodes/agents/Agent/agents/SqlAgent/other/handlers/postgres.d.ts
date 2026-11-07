import { DataSource } from '@n8n/typeorm';
import { type IExecuteFunctions } from 'n8n-workflow';
export declare function getPostgresDataSource(this: IExecuteFunctions): Promise<DataSource>;
