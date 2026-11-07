import type { Attributes } from '@opentelemetry/api';
export declare function toPromName(name: string, kind: 'counter' | 'gauge' | 'histogram', prefix: string): string;
export declare function normalizeAttributes(attributes?: Record<string, unknown>): Attributes | undefined;
export declare function normalizeAttributeValue(value: unknown): Attributes[string] | undefined;
