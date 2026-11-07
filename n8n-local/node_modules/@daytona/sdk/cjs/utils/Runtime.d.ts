declare global {
    /**
     * In Deno this global exists and has a `version.deno` string;
     * in all other runtimes it will be `undefined`.
     */
    var Deno: {
        version: {
            deno: string;
        };
        env: {
            get(name: string): string | undefined;
            toObject(): Record<string, string>;
        };
    } | undefined;
    /**
     * In Bun this global exists and has a `version.bun` string;
     * in all other runtimes it will be `undefined`.
     */
    var Bun: {
        version: {
            bun: string;
        };
        file: (path: string) => File;
    } | undefined;
}
export declare enum Runtime {
    NODE = "node",
    DENO = "deno",
    BUN = "bun",
    BROWSER = "browser",
    SERVERLESS = "serverless",
    UNKNOWN = "unknown"
}
export declare const RUNTIME: Runtime;
export declare function getEnvVar(name: string): string | undefined;
export declare class DaytonaEnvReader {
    private readonly envLocalVars;
    private readonly envVars;
    constructor();
    get(name: string): string | undefined;
    private static parseFileVars;
}
export declare function isServerlessRuntime(): boolean;
//# sourceMappingURL=Runtime.d.ts.map