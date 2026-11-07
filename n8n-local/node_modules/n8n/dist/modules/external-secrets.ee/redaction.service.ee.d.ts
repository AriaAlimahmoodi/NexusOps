import type { IDataObject, INodeProperties } from 'n8n-workflow';
export declare class RedactionService {
    redact(data: IDataObject, properties: INodeProperties[]): IDataObject;
    unredact(redactedData: IDataObject, savedData: IDataObject): IDataObject;
    private shouldRedactValue;
    private unredactRestoreValues;
}
