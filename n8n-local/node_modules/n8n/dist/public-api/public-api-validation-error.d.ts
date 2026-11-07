import type { ZodError } from 'zod';
export declare function formatValidationError(location: 'body' | 'query' | 'params', error: ZodError): string;
