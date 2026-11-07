import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
/**
 * Get all activity types
 * Uses v1 endpoint: /activityTypes
 */
export declare function getActivityTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
/**
 * Get all filters for a resource
 * Uses v1 endpoint: /filters
 */
export declare function getFilters(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
/**
 * Get all organizations
 * Uses v2 endpoint: /organizations
 */
export declare function getOrganizationIds(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
/**
 * Get all users (active only)
 * Uses v1 endpoint: /users
 */
export declare function getUserIds(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
/**
 * Get all deals
 * Uses v2 endpoint: /deals
 */
export declare function getDeals(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
/**
 * Get all products
 * Uses v2 endpoint: /products
 */
export declare function getProducts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
/**
 * Get all products of a deal
 * Uses v2 endpoint: /deals/{id}/products
 */
export declare function getProductsDeal(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
/**
 * Get all stages
 * Uses v2 endpoint: /stages
 */
export declare function getStageIds(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
export declare function getPersonLabels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
export declare function getOrganizationLabels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
/**
 * Get all persons
 * Uses v2 endpoint: /persons
 */
export declare function getPersons(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
/**
 * Get all lead labels
 * Uses v1 endpoint: /leadLabels
 */
export declare function getLeadLabels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
export declare function getDealLabels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
//# sourceMappingURL=loadOptions.d.ts.map