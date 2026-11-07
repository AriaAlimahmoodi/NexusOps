export declare function toolResult(data: Record<string, unknown>, isError?: boolean): {
    content: {
        type: 'text';
        text: string;
    }[];
    structuredContent: Record<string, unknown>;
    isError?: boolean | undefined;
};
