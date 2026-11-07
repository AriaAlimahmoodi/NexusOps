import type { Request, Response } from 'express';
import type { PushRequest, PushResponse, SSEPushRequest, WebSocketPushRequest } from './types';
export declare function isPushRequest(req: Request): req is PushRequest;
export declare function isSSEPushRequest(req: Request): req is SSEPushRequest;
export declare function isWebSocketPushRequest(req: Request): req is WebSocketPushRequest;
export declare function isPushResponse(res: Response): res is PushResponse;
