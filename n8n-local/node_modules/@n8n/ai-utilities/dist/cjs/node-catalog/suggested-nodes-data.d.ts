export interface CategorySuggestedNode {
    name: string;
    note?: string;
}
export interface CategoryData {
    description: string;
    patternHint: string;
    nodes: CategorySuggestedNode[];
}
export declare const suggestedNodesData: Record<string, CategoryData>;
export declare const categoryList: string[];
