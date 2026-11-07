export interface TruncateJsonOptions {
    maxLength?: number;
    indent?: number;
}
export declare function truncateJson(value: unknown, options?: TruncateJsonOptions): string;
