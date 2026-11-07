import type { IDataObject, INodeExecutionData } from 'n8n-workflow';
import type { ICustomProperties } from '../transport';
/**
 * Encodes human-readable custom field names to Pipedrive API keys for v2 endpoints.
 * Places custom fields under `item.custom_fields = { key: value }`.
 */
export declare function encodeCustomFieldsV2(customProperties: ICustomProperties, item: IDataObject): void;
/**
 * Resolves custom field keys from v2 API response to human-readable names.
 * Reads from `item.json.custom_fields`, resolves in-place keeping nested structure.
 */
export declare function resolveCustomFieldsV2(customProperties: ICustomProperties, item: INodeExecutionData): void;
//# sourceMappingURL=customFields.d.ts.map