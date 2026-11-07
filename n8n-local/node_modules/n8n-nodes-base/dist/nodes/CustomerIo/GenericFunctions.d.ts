import type { IExecuteFunctions, IHookFunctions, ILoadOptionsFunctions, IDataObject, IHttpRequestMethods } from 'n8n-workflow';
export declare function customerIoApiRequest(this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions, method: IHttpRequestMethods, endpoint: string, body: object, baseApi?: string, _query?: IDataObject): Promise<any>;
/** Convert dot-separated event names to underscore-separated API format */
export declare function toApiEventName(event: string): string;
/** Check if all current events exist in the webhook's event list */
export declare function eventExists(currentEvents: string[], webhookEvents: string[]): boolean;
export declare function validateJSON(json: string | undefined): any;
//# sourceMappingURL=GenericFunctions.d.ts.map