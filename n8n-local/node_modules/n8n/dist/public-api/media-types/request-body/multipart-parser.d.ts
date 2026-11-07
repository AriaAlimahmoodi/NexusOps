import type { MultipartUploadLimits } from '@n8n/decorators';
import type { RequestHandler } from 'express';
export declare function loadMultipartParser(limits: MultipartUploadLimits): Promise<RequestHandler>;
