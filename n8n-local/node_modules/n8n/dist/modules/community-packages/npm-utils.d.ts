interface NpmCommandOptions {
    cwd?: string;
    doNotHandleError?: boolean;
    registry?: string;
    authToken?: string;
}
interface NpmRequestOptions {
    authToken?: string;
    headers?: Record<string, string>;
    timeout?: number;
}
export declare function isNpmExecErrorWithStdout(error: unknown): error is {
    code: number;
    stdout: string;
};
export declare function executeNpmCommand(args: string[], options?: NpmCommandOptions): Promise<string>;
export declare function executeNpmRequest<T = unknown>(registryUrl: string, path: string, options?: NpmRequestOptions): Promise<T>;
export declare function verifyIntegrity(packageName: string, version: string, registryUrl: string, expectedIntegrity: string, authToken?: string): Promise<void>;
export declare function checkIfVersionExistsOrThrow(packageName: string, version: string, registryUrl: string, authToken?: string): Promise<true>;
export {};
