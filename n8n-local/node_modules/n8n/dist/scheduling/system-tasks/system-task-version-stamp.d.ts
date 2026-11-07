export type SystemTaskJobPayload = {
    n8nVersion: string;
};
export declare function versionStamp(): SystemTaskJobPayload;
export declare function stampedByNewerVersion(payload: Record<string, unknown>): boolean;
