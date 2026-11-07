import type { RequestBodyMedia, RequestBodyMediaType } from '@n8n/decorators';
import type { RequestBodyHandler } from './types';
export type { RequestBodyHandler } from './types';
export declare const REQUEST_BODY_HANDLERS: Record<RequestBodyMediaType, RequestBodyHandler>;
export declare const JSON_REQUEST_BODY_MEDIA: RequestBodyMedia;
