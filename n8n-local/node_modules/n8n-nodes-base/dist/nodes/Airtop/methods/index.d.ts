import type { ILoadOptionsFunctions, INodeListSearchResult, ResourceMapperFields } from 'n8n-workflow';
/**
 * Searches for Airtop agents available in the user's account.
 * Used as the searchListMethod for the agent resourceLocator.
 */
export declare function listSearchAgents(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult>;
/**
 * Maps the agent parameters to the resource mapper fields.
 * Used as the resourceMapperMethod for the agent parameters dropdown.
 */
export declare function agentsResourceMapping(this: ILoadOptionsFunctions): Promise<ResourceMapperFields>;
//# sourceMappingURL=index.d.ts.map