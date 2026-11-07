import { type ProviderCatalog } from '@n8n/agents/catalog';
export declare function buildModelRecommendationsSection(catalog: ProviderCatalog): string | null;
export declare function getModelRecommendationsSection(): Promise<string | null>;
export declare function resetModelRecommendationsCacheForTest(): void;
