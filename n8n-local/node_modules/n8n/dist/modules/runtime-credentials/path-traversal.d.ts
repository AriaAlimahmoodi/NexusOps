import type { IDataObject } from 'n8n-workflow';
type DataValue = IDataObject[string];
export declare function extractAndClear(obj: IDataObject, path: string): DataValue | undefined;
export {};
