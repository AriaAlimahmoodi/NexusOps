interface NormalizableSpec {
    type: 'json' | 'text' | 'binary' | 'error';
    body?: unknown;
}
export interface ProviderRequestInfo {
    method: string;
    pathname: string;
    hostname?: string;
}
export declare function applyProviderShapeNormalizers(info: ProviderRequestInfo, spec: NormalizableSpec): void;
export declare function findProviderShapeViolation(info: ProviderRequestInfo, body: unknown): string | undefined;
export {};
