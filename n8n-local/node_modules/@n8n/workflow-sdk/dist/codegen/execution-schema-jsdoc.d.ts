import type { Schema } from 'n8n-workflow';
export declare function schemaToOutputSample(schema: Schema, excludeValues?: boolean): Record<string, unknown> | null;
export declare function generateSchemaJSDoc(nodeName: string, schema: Schema): string;
