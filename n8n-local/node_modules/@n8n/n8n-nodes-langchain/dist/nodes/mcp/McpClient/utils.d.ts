import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import type { ResourceMapperField, FieldType } from 'n8n-workflow';
export declare function jsonSchemaTypeToDefaultValue(schema: JSONSchema7Definition): string | number | boolean | object | null;
export declare function jsonSchemaTypeToFieldType(schema: JSONSchema7): FieldType;
export declare function convertJsonSchemaToResourceMapperFields(schema: JSONSchema7): ResourceMapperField[];
