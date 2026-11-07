import type { IDataObject } from 'n8n-workflow';
/**
 * Copies fields from an additionalFields/updateFields collection into the request body.
 * Handles the `customFields` fixed-collection by unpacking its `property` array
 * into individual key-value pairs on the body.
 */
export declare function addFieldsToBody(body: IDataObject, fields: IDataObject): void;
//# sourceMappingURL=fields.d.ts.map