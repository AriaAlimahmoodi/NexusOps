import { DataSource } from '@n8n/typeorm';
import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
export declare function getSqliteDataSource(this: IExecuteFunctions, binary: INodeExecutionData['binary'], binaryPropertyName?: string): Promise<DataSource>;
