declare const loaderMap: {
    'fast-glob': () => Promise<any>;
    '@iarna/toml': () => Promise<any>;
    stream: () => Promise<any>;
    tar: () => Promise<any>;
    'expand-tilde': () => Promise<any>;
    ObjectStorage: () => Promise<any>;
    fs: () => Promise<any>;
    'form-data': () => Promise<any>;
    util: () => Promise<any>;
};
declare const requireMap: {
    'fast-glob': () => any;
    '@iarna/toml': () => any;
    stream: () => any;
    tar: () => any;
    'expand-tilde': () => any;
    fs: () => any;
    'form-data': () => any;
    buffer: () => any;
    busboy: () => any;
    '@opentelemetry/api': () => any;
    '@opentelemetry/sdk-node': () => any;
    '@opentelemetry/instrumentation-http': () => any;
    '@opentelemetry/sdk-trace-base': () => any;
    '@opentelemetry/exporter-trace-otlp-http': () => any;
    '@opentelemetry/otlp-exporter-base': () => any;
    '@opentelemetry/semantic-conventions': () => any;
    '@opentelemetry/resources': () => any;
};
type ModuleMap = typeof loaderMap;
export declare function dynamicImport<K extends keyof ModuleMap>(name: K, errorPrefix?: string): Promise<Awaited<ReturnType<ModuleMap[K]>>>;
type RequireMap = typeof requireMap;
export declare function dynamicRequire<K extends keyof RequireMap>(name: K, errorPrefix?: string): ReturnType<RequireMap[K]>;
export declare function getPackageInfo(): {
    name: string;
    version: string;
};
export {};
//# sourceMappingURL=Import.d.ts.map