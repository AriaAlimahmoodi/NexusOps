export declare const ASK_USER_CONTENT_MARKERS: {
    askUserMarker: string;
    legacyAskUserMarker: string;
};
export declare function buildSearchLikePattern(query: string): string;
export declare function buildVisibleRowCondition(alias: string): string;
export declare const VISIBLE_ROW_MARKERS: {
    askUserMarker: string;
    legacyAskUserMarker: string;
    toolCallMarker: string;
    invalidToolCallMarker: string;
};
export declare function buildMessageMatchCondition(alias: string): string;
