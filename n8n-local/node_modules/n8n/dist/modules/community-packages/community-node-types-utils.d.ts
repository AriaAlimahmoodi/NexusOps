import type { GatewayCreditsPromotion } from '@n8n/api-types';
import type { INodeTypeDescription } from 'n8n-workflow';
import { type StrapiFilters } from '../../utils/strapi-utils';
export type StrapiCommunityNodeType = {
    id: number;
    authorGithubUrl: string;
    authorName: string;
    checksum: string;
    description: string;
    displayName: string;
    name: string;
    numberOfStars: number;
    numberOfDownloads: number;
    packageName: string;
    createdAt: string;
    updatedAt: string;
    npmVersion: string;
    isOfficialNode: boolean;
    companyName?: string;
    nodeDescription: INodeTypeDescription;
    nodeVersions?: Array<{
        npmVersion: string;
        checksum: string;
    }>;
    aiNodeSdkVersion?: number;
    gatewayCreditsPromotion?: GatewayCreditsPromotion | null;
};
export declare function selectVettedVersion(vetted: Pick<StrapiCommunityNodeType, 'npmVersion' | 'checksum' | 'nodeVersions'>, requestedVersion: string | undefined): {
    version: string;
    checksum: string | undefined;
};
export type CommunityNodesMetadata = Pick<StrapiCommunityNodeType, 'id' | 'name' | 'npmVersion' | 'updatedAt'>;
export declare function getCommunityNodeTypes(environment: 'staging' | 'production', qs: {
    filters?: StrapiFilters;
    fields?: string[];
} | undefined, maxAiNodeSdk: number, maxN8nNodesApiVersion: string): Promise<StrapiCommunityNodeType[]>;
export declare function getCommunityNodesMetadata(environment: 'staging' | 'production', maxAiNodeSdk: number, maxN8nNodesApiVersion: string): Promise<CommunityNodesMetadata[]>;
