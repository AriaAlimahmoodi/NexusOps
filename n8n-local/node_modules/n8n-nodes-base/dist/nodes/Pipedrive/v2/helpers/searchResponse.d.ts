import type { IDataObject } from 'n8n-workflow';
/**
 * Parses a Pipedrive v1 search API response into a flat array of result objects.
 *
 * The v1 search endpoint returns `data.items[].item` with a `result_score` on each entry.
 * When the response comes from a v2-style paginated helper it may already be a flat array.
 */
export declare function parseSearchResponse(responseData: IDataObject): IDataObject[];
//# sourceMappingURL=searchResponse.d.ts.map