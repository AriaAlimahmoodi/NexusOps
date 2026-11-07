import type { RequestBodyMedia, RequestBodyMediaType } from '@n8n/decorators';
import type { Request, Response } from 'express';
import type { ZodError } from 'zod';
export interface RequestBodyHandler {
    readonly mediaType: RequestBodyMediaType;
    readonly errorStatuses: readonly number[];
    readonly discoverable: boolean;
    parseBody?(media: RequestBodyMedia, req: Request, res: Response): Promise<void>;
    readInput(req: Request): unknown;
    formatValidationError(error: ZodError): string;
}
