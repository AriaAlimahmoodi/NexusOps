import { ReadStream } from "node:fs";
/**
 * @internal
 */
export declare const runtimeConfig: {
    runtime: string;
    statSync: import("fs").StatSyncFn;
    isFileReadStream(f: unknown): f is ReadStream;
};
